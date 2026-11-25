import { MetadataCache, TFile } from 'obsidian';

/** Obsidian-style tags: unicode letters/digits, `_`, `-` and nested `/`. */
const INLINE_TAG_RE = /#([\p{L}\p{N}_/-]+)/gu;

/** Strip leading `#`, trim and lowercase so comparisons are uniform. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').toLowerCase();
}

/** Split the space-separated prompt input into unique normalized tags. */
export function parseTagInput(input: string): string[] {
  const tags = new Set<string>();
  for (const token of input.trim().split(/\s+/)) {
    const tag = normalizeTag(token);
    if (tag) tags.add(tag);
  }
  return [...tags];
}

/** Extract inline `#tag` tokens from a piece of text. */
export function extractInlineTags(text: string): string[] {
  const tags: string[] = [];
  for (const match of text.matchAll(INLINE_TAG_RE)) {
    const tag = normalizeTag(match[1]);
    if (tag) tags.push(tag);
  }
  return tags;
}

/** Read `tags:` from frontmatter, accepting strings, arrays and `a, b` lists. */
export function getFrontmatterTags(cache: MetadataCache, file: TFile): string[] {
  const frontmatter = cache.getFileCache(file)?.frontmatter;
  if (!frontmatter) return [];

  const raw = (frontmatter as Record<string, unknown>)['tags'];
  if (raw == null) return [];

  const values = Array.isArray(raw) ? raw : [raw];
  const tags = new Set<string>();
  for (const value of values) {
    if (value == null) continue;
    for (const piece of String(value).split(/[,\s]+/)) {
      const tag = normalizeTag(piece);
      if (tag) tags.add(tag);
    }
  }
  return [...tags];
}

/** 0-based line of the first frontmatter field, or null when there is none. */
export function getFrontmatterStartLine(cache: MetadataCache, file: TFile): number | null {
  const position = cache.getFileCache(file)?.frontmatterPosition;
  return position ? position.start.line + 1 : null;
}

/** All requested tags must be present (AND semantics, order independent). */
export function containsAllTags(available: string[], wanted: string[]): boolean {
  const set = new Set(available);
  return wanted.every((tag) => set.has(tag));
}
