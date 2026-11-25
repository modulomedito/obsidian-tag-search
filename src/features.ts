import { App, MarkdownView, Notice, TFile } from 'obsidian';
import { promptForTags } from './tag-input-modal';
import {
  containsAllTags,
  extractInlineTags,
  getFrontmatterStartLine,
  getFrontmatterTags,
  parseTagInput,
} from './tags';
import { ResultSink, SearchResult } from './types';

const NO_TAGS = 'No tags entered.';
const NO_MATCH = ' -------> No matching lines found.';

async function askTags(app: App, prompt: string): Promise<string[] | null> {
  const raw = await promptForTags(app, prompt);
  if (raw === null) return null; // dialog dismissed
  const tags = parseTagInput(raw);
  if (tags.length === 0) {
    new Notice(NO_TAGS);
    return null;
  }
  return tags;
}

function title(prefix: string, tags: string[]): string {
  return `${prefix}: ${tags.join(', ')}`;
}

/** Shared result line collection: inline lines + a frontmatter row if it matches alone. */
function collectResults(
  app: App,
  file: TFile,
  content: string,
  tags: string[],
  requireLineStart = false
): SearchResult[] {
  const results: SearchResult[] = [];
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const seen = new Set<string>();

  lines.forEach((line, index) => {
    // In-buffer search requires a leading `#` (as in nvim); global search accepts any position.
    if (requireLineStart && !line.trimStart().startsWith('#')) return;
    const found = extractInlineTags(line);
    if (found.length === 0 || !containsAllTags(found, tags)) return;
    const key = `${index + 1}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ file, line: index + 1, text: line.trim(), kind: 'inline' });
  });

  const frontmatterTags = getFrontmatterTags(app.metadataCache, file);
  const frontmatterLine = getFrontmatterStartLine(app.metadataCache, file);
  if (frontmatterLine !== null && containsAllTags(frontmatterTags, tags)) {
    results.push({
      file,
      line: Math.min(frontmatterLine + 1, lines.length),
      text: `tags: ${frontmatterTags.join(', ')}`,
      kind: 'frontmatter',
    });
  }

  return results;
}

/** Open a hit and place the cursor on its line (editor lines are 0-based). */
export async function openResult(app: App, result: SearchResult): Promise<void> {
  // Prefer a Markdown leaf so clicking a result never replaces the sidebar results view.
  const leaf =
    app.workspace.getActiveViewOfType(MarkdownView)?.leaf ??
    app.workspace.getLeavesOfType('markdown')[0] ??
    app.workspace.getLeaf(false);
  await leaf.openFile(result.file);
  if (result.line > 0) {
    const view = app.workspace.getActiveViewOfType(MarkdownView);
    view?.editor.setCursor({ line: result.line - 1, ch: 0 });
  }
}

async function present(
  app: App,
  sink: ResultSink,
  results: SearchResult[],
  heading: string
): Promise<void> {
  await sink(results, heading);
  if (results.length === 0) {
    new Notice(NO_MATCH);
    return;
  }
  if (results.length === 1) {
    await openResult(app, results[0]);
  }
}

/** `RookieTagUpdate`: merge tags on the current line, sort, dedupe, rewrite. */
export async function updateTags(app: App): Promise<void> {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  if (!view?.editor) {
    new Notice('No active Markdown note.');
    return;
  }
  const inputTags = await askTags(app, 'Update tags (space separated):');
  if (!inputTags) return;

  const editor = view.editor;
  const lineNumber = editor.getCursor().line;
  const existing = extractInlineTags(editor.getLine(lineNumber));
  const merged = [...new Set([...existing, ...inputTags])].sort();
  editor.setLine(lineNumber, merged.map((tag) => `#${tag}`).join(' '));
}

/** `RookieTagSearch`: AND-search lines in the current note. */
export async function searchTags(app: App, sink: ResultSink): Promise<void> {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  if (!view?.file || !view.editor) {
    new Notice('No active Markdown note.');
    return;
  }
  const tags = await askTags(app, 'Enter tags (space separated):');
  if (!tags) return;

  const results = collectResults(app, view.file, view.editor.getValue(), tags, true);
  await present(app, sink, results, title('Tag Search', tags));
}

/** `RookieTagSearchGlobal`: AND-search every Markdown file in the vault. */
export async function searchGlobalTags(app: App, sink: ResultSink): Promise<void> {
  const tags = await askTags(app, 'Enter global search tags (space separated):');
  if (!tags) return;

  const results: SearchResult[] = [];
  for (const file of app.vault.getMarkdownFiles()) {
    const content = await app.vault.cachedRead(file);
    results.push(...collectResults(app, file, content, tags));
  }
  await present(app, sink, results, title('Global Tag Search', tags));
}

/** `RookieTagAddFileName`: rename `<name>.<ext>` to a sorted hyphenated tag list. */
export async function addFileNameTags(app: App): Promise<void> {
  const file = app.workspace.getActiveViewOfType(MarkdownView)?.file ?? app.workspace.getActiveFile();
  if (!file) {
    new Notice('No active file.');
    return;
  }
  const inputTags = await askTags(app, 'Enter file name tags (space separated):');
  if (!inputTags) return;

  const fromFileName = file.basename.split('-').map((part) => part.trim()).filter(Boolean);
  const merged = [...new Set([...fromFileName, ...inputTags])].sort();
  const newName = `${merged.join('-')}.${file.extension}`;
  const folder = file.parent?.path ?? '/';
  const newPath = folder === '/' ? newName : `${folder}/${newName}`;

  if (newPath === file.path) {
    new Notice('File name unchanged.');
    return;
  }
  const existing = app.vault.getAbstractFileByPath(newPath);
  if (existing && existing !== file) {
    new Notice(`File already exists: ${newPath}`);
    return;
  }
  await app.fileManager.renameFile(file, newPath);
}

/** `RookieTagSearchFileName`: case-insensitive AND-substring match on file names. */
export async function searchFileNameTags(app: App, sink: ResultSink): Promise<void> {
  const tags = await askTags(app, 'Search file name tags (space separated):');
  if (!tags) return;

  const results: SearchResult[] = [];
  for (const file of app.vault.getFiles()) {
    const name = file.basename.toLowerCase();
    if (tags.every((tag) => name.includes(tag))) {
      results.push({ file, line: 0, text: file.path, kind: 'file' });
    }
  }
  await present(app, sink, results, title('File Name Tag Search', tags));
}
