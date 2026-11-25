import { TFile } from 'obsidian';

export type ResultKind = 'inline' | 'frontmatter' | 'file';

/** A single search hit. `line` is 1-based; 0 means the result is file-only. */
export interface SearchResult {
  file: TFile;
  line: number;
  text: string;
  kind: ResultKind;
}

export type ResultSink = (results: SearchResult[], title: string) => void | Promise<void>;
