# Tag Search (rookie)

Ports five tag-related features from the Neovim plugin [`rookie_tag.nvim`](https://github.com/modulomedito/rookie_tag.nvim) to Obsidian.

## Features and commands

Open the command palette (Ctrl/Cmd + P) and search for a command name:

| Command | nvim equivalent | Default key (nvim) | Description |
|---|---|---|---|
| Update tags on current line | `:RookieTagUpdate` | `<leader>fa` | Merge the `#tags` on the current line with the tags you enter, then deduplicate, sort, and rewrite the line |
| Search tags in current note | `:RookieTagSearch` | `<leader>ff` | Find lines in the current note that contain **all** entered tags (AND) |
| Search tags across vault | `:RookieTagSearchGlobal` | `<leader>FF` | Run the same AND search across every Markdown note in the vault |
| Add tags to current file name | `:RookieTagAddFileName` | `<leader>Fa` | Split the file name on `-`, merge with the entered tags, deduplicate, sort, and rename the file |
| Search files by name tags | `:RookieTagSearchFileName` | `<leader>Ff` | Case-insensitive AND substring search on file names |
| Go to next tag search result | New | — | Jump to the next result (wraps across notes) |
| Go to previous tag search result | New | — | Jump to the previous result (wraps across notes) |

Enter tags separated by spaces (for example `project pending`); the leading `#` is optional. Obsidian does not allow plugins to ship default hotkeys, so bind the commands yourself under **Settings → Hotkeys**; `Alt+↓` / `Alt+↑` are suggested for the navigation commands.

Search results appear in the **Tag Search** sidebar view (the equivalent of the quickfix window). Click a result to open its note and jump to the matching line; when there is only one result, the jump happens automatically. The **Clear** button empties the result list. The previous/next commands cycle through the results in order and highlight the current one; if there are no results you will be prompted to run a search first.

## Ribbon menu

The `#` icon in the left ribbon opens a menu containing every command above. Search actions are grouped separately from the previous/next result navigation. The menu and the command palette run the same actions, so assign hotkeys only to the commands you use often.

## Differences from the nvim version

- Tag sources include both inline `#tag` and YAML frontmatter `tags:` (arrays, strings, or `a, b`); frontmatter is shown as a separate result that jumps to the properties section.
- Tag characters are extended to Obsidian's letters, digits, `_`, `-`, and nested `/` (the nvim version only matches `%w`).
- Tag comparison is case-insensitive and matches whole tags; file-name search uses the basename without its extension.
- Current-note search requires `#` at the start of the line (as in nvim); vault-wide search allows tags anywhere in the line (matching nvim's `rg` behaviour).
- Vault-wide search reads files through the Obsidian API instead of `rg`, so it works on mobile.

## Installation

1. Run `npm install` and `npm run build` to produce `main.js` in the project root.
2. Copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/tag-search-rookie/`.
3. Reload Obsidian and enable the plugin.

## Development

```bash
npm install
npm run typecheck   # TypeScript check
npm run dev         # watch build
npm run build       # production build
```

## License

See [LICENSE](LICENSE).
