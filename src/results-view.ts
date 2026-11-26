import { ItemView, Notice, WorkspaceLeaf } from 'obsidian';
import { openResult } from './features';
import { SearchResult } from './types';

export const VIEW_TYPE = 'tag-search-results';

/** Sidebar panel equivalent to nvim's quickfix window. */
export class ResultsView extends ItemView {
  private results: SearchResult[] = [];
  private heading = 'Tag Search Results';
  private activeIndex = -1;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Tag Search';
  }

  getIcon(): string {
    return 'search';
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  setResults(results: SearchResult[], heading: string): void {
    this.results = results;
    this.heading = heading;
    this.activeIndex = -1;
    this.render();
  }

  /** Walk the result list with wrap-around and open the target note. */
  async navigate(step: 1 | -1): Promise<void> {
    if (this.results.length === 0) {
      new Notice('No tag search results. Run a search first.');
      return;
    }
    const total = this.results.length;
    const next =
      step === 1
        ? (this.activeIndex + 1) % total
        : this.activeIndex <= 0
          ? total - 1
          : this.activeIndex - 1;
    await this.activate(next);
  }

  private async activate(index: number): Promise<void> {
    this.activeIndex = index;
    this.render();
    this.contentEl.querySelectorAll('.tag-search-result')[index]?.scrollIntoView({
      block: 'nearest',
    });
    await openResult(this.app, this.results[index]);
  }

  private render(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass('tag-search-view');

    const header = root.createDiv({ cls: 'tag-search-view-header' });
    header.createSpan({ cls: 'tag-search-view-title', text: this.heading });
    header.createSpan({
      cls: 'tag-search-view-count',
      text: `${this.results.length} result${this.results.length === 1 ? '' : 's'}`,
    });
    header
      .createEl('button', { cls: 'tag-search-clear', text: 'Clear' })
      .addEventListener('click', () => this.setResults([], this.heading));

    const list = root.createDiv({ cls: 'tag-search-view-list' });
    if (this.results.length === 0) {
      const empty = list.createDiv({ cls: 'tag-search-empty' });
      empty.createDiv({ cls: 'tag-search-empty-title', text: 'No matches' });
      empty.createDiv({
        cls: 'tag-search-empty-hint',
        text: 'Try fewer tags or a broader search.',
      });
      return;
    }

    this.results.forEach((result, index) => {
      const row = list.createDiv({
        cls: `tag-search-result${index === this.activeIndex ? ' is-active' : ''}`,
      });
      const top = row.createDiv({ cls: 'tag-search-result-top' });
      top.createSpan({ cls: 'tag-search-result-file', text: result.file.basename });
      if (result.line > 0) {
        top.createSpan({ cls: 'tag-search-result-line', text: `:${result.line}` });
      }
      top.createSpan({ cls: 'tag-search-result-kind', text: result.kind });
      row.createDiv({ cls: 'tag-search-result-text', text: result.text });
      row.addEventListener('click', () => void this.activate(index));
    });
  }
}
