# obsidian-tag-search

把 Neovim 插件 [`rookie_tag.nvim`](https://github.com/modulomedito/rookie_tag.nvim) 的五个功能移植到 Obsidian。

## 功能与命令

在命令面板（Ctrl/Cmd + P）中搜索命令名即可调用：

| 命令 | 对应 nvim 命令 | 默认键位（nvim） | 说明 |
|---|---|---|---|
| Update tags on current line | `:RookieTagUpdate` | `<leader>fa` | 合并光标当前行的 `#tag` 与新输入的标签，去重、排序后重写该行 |
| Search tags in current note | `:RookieTagSearch` | `<leader>ff` | 在当前笔记中查找「同一行包含全部输入标签」的行（AND） |
| Search tags across vault | `:RookieTagSearchGlobal` | `<leader>FF` | 在整个仓库的 Markdown 笔记中做同样的 AND 搜索 |
| Add tags to current file name | `:RookieTagAddFileName` | `<leader>Fa` | 按 `-` 拆分文件名，与输入标签合并去重排序后重命名文件 |
| Search files by name tags | `:RookieTagSearchFileName` | `<leader>Ff` | 按文件名做大小写无关的 AND 子串搜索 |
| Go to next tag search result | 新增 | — | 跳到结果列表中的下一条（可跨笔记，末尾回到开头） |
| Go to previous tag search result | 新增 | — | 跳到结果列表中的上一条（可跨笔记，开头回到末尾） |

输入标签用空格分隔（例如 `project pending`），前缀 `#` 可省略。Obsidian 无法在代码里设置默认热键，可在 `设置 → 快捷键` 中按上表自行绑定；导航命令建议绑定 `Alt+↓` / `Alt+↑`。

搜索结果出现在右侧栏的 **Tag Search** 面板（对应 quickfix 窗口）：点击任意结果即可打开笔记并跳到对应行；只有一条结果时会自动跳转。面板上的 **Clear** 按钮可清空结果。上一条/下一条命令按结果列表顺序循环跳转，当前项会在面板中高亮；尚无结果时会提示先执行搜索。

## 与 nvim 版的差异

- 标签来源除正文内联 `#tag` 外，也读取 YAML frontmatter 的 `tags:`（支持数组、字符串、`a, b` 写法）；frontmatter 单独作为一条结果，点击跳到属性区。
- 标签字符扩展到 Obsidian 习惯的字母、数字、`_`、`-` 和嵌套 `/`（nvim 版只识别 `%w`）。
- 标签比较统一小写、按完整标签匹配；文件名搜索使用不含扩展名的 basename。
- 当前笔记搜索要求行首为 `#`（与 nvim 一致）；全库搜索允许标签出现在行内任意位置（与 nvim 的 `rg` 一致）。
- 全库搜索使用 Obsidian API 逐文件读取，不依赖 `rg`，因此可在移动端使用。

## 安装

1. 执行 `npm install` 和 `npm run build`，生成根目录的 `main.js`。
2. 把 `main.js`、`manifest.json`、`styles.css` 复制到 vault 的 `.obsidian/plugins/tag-search-rookie/` 目录。
3. 在 Obsidian 中重新加载插件并启用。

## 开发

```bash
npm install
npm run typecheck   # TypeScript 检查
npm run dev         # watch 模式构建
npm run build       # 生产构建
```
