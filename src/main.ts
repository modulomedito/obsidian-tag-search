import { Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import {
  addFileNameTags,
  searchFileNameTags,
  searchGlobalTags,
  searchTags,
  updateTags,
} from './features';
import { ResultsView, VIEW_TYPE } from './results-view';
import { ResultSink, SearchResult } from './types';

export default class TagSearchPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE, (leaf) => new ResultsView(leaf));

    const sink: ResultSink = (results: SearchResult[], heading: string) =>
      this.showResults(results, heading);

    this.addCommand({
      id: 'update-tags',
      name: 'Update tags on current line',
      callback: () => updateTags(this.app),
    });
    this.addCommand({
      id: 'search-tags',
      name: 'Search tags in current note',
      callback: () => searchTags(this.app, sink),
    });
    this.addCommand({
      id: 'search-global-tags',
      name: 'Search tags across vault',
      callback: () => searchGlobalTags(this.app, sink),
    });
    this.addCommand({
      id: 'add-file-name-tags',
      name: 'Add tags to current file name',
      callback: () => addFileNameTags(this.app),
    });
    this.addCommand({
      id: 'search-file-name-tags',
      name: 'Search files by name tags',
      callback: () => searchFileNameTags(this.app, sink),
    });
    this.addCommand({
      id: 'next-result',
      name: 'Go to next tag search result',
      callback: () => this.navigateResult(1),
    });
    this.addCommand({
      id: 'previous-result',
      name: 'Go to previous tag search result',
      callback: () => this.navigateResult(-1),
    });
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  private async navigateResult(step: 1 | -1): Promise<void> {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      new Notice('No tag search results. Run a search first.');
      return;
    }
    const view = leaf.view;
    if (!(view instanceof ResultsView)) return;
    await this.app.workspace.revealLeaf(leaf);
    await view.navigate(step);
  }

  private async showResults(results: SearchResult[], heading: string): Promise<void> {
    let leaf: WorkspaceLeaf | null = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0] ?? null;
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      if (!leaf) return;
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    const view = leaf.view;
    if (view instanceof ResultsView) {
      view.setResults(results, heading);
    }
    await this.app.workspace.revealLeaf(leaf);
  }
}
