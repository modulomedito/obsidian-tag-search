import { Menu, Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import {
  addFileNameTags,
  searchFileNameTags,
  searchGlobalTags,
  searchTags,
  updateTags,
} from './features';
import { ResultsView, VIEW_TYPE } from './results-view';
import { ResultSink, SearchResult } from './types';

type FeatureAction = () => void | Promise<void>;

interface FeatureDefinition {
  id: string;
  name: string;
  icon: string;
  action: FeatureAction;
}

export default class TagSearchPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE, (leaf) => new ResultsView(leaf));

    const sink: ResultSink = (results: SearchResult[], heading: string) =>
      this.showResults(results, heading);

    const features: FeatureDefinition[] = [
      {
        id: 'update-tags',
        name: 'Update tags on current line',
        icon: 'pencil',
        action: () => updateTags(this.app),
      },
      {
        id: 'search-tags',
        name: 'Search tags in current note',
        icon: 'search',
        action: () => searchTags(this.app, sink),
      },
      {
        id: 'search-global-tags',
        name: 'Search tags across vault',
        icon: 'globe',
        action: () => searchGlobalTags(this.app, sink),
      },
      {
        id: 'add-file-name-tags',
        name: 'Add tags to current file name',
        icon: 'file',
        action: () => addFileNameTags(this.app),
      },
      {
        id: 'search-file-name-tags',
        name: 'Search files by name tags',
        icon: 'folder',
        action: () => searchFileNameTags(this.app, sink),
      },
      {
        id: 'next-result',
        name: 'Go to next tag search result',
        icon: 'arrow-down',
        action: () => this.navigateResult(1),
      },
      {
        id: 'previous-result',
        name: 'Go to previous tag search result',
        icon: 'arrow-up',
        action: () => this.navigateResult(-1),
      },
    ];

    for (const feature of features) {
      this.addCommand({
        id: feature.id,
        name: feature.name,
        callback: feature.action,
      });
    }

    this.addRibbonIcon('hash', 'Tag Search (rookie)', (event: MouseEvent) => {
      const menu = new Menu();
      features.forEach((feature, index) => {
        // Separate search actions from result navigation.
        if (index === 5) menu.addSeparator();
        menu.addItem((item) =>
          item
            .setTitle(feature.name)
            .setIcon(feature.icon)
            .onClick(() => void feature.action())
        );
      });
      menu.showAtMouseEvent(event);
    });
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
