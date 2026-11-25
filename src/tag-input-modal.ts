import { App, Modal, Setting, TextComponent } from 'obsidian';

/** nvim's `vim.fn.input()` equivalent: a small centered prompt. */
export function promptForTags(
  app: App,
  title: string,
  placeholder = 'Enter tags (space separated)',
  buttonLabel = 'OK'
): Promise<string | null> {
  return new Promise((resolve) => {
    new TagInputModal(app, title, placeholder, buttonLabel, resolve).open();
  });
}

class TagInputModal extends Modal {
  private input: TextComponent | null = null;
  private settled = false;

  constructor(
    app: App,
    private title: string,
    private placeholder: string,
    private buttonLabel: string,
    private resolve: (value: string | null) => void
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass('tag-search-input-modal');
    if (this.isCompactScreen()) {
      this.modalEl.addClass('tag-search-modal-pinned');
    }
    this.contentEl.createEl('h2', { text: this.title });

    new Setting(this.contentEl)
      .addText((text) => {
        this.input = text;
        text.setPlaceholder(this.placeholder);
        text.inputEl.setAttribute('aria-label', 'Tags');
        text.inputEl.addEventListener('keydown', (event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            this.submit();
          }
        });
        window.setTimeout(() => text.inputEl.focus(), 0);
      })
      .addButton((button) =>
        button.setButtonText(this.buttonLabel).setCta().onClick(() => this.submit())
      );
  }

  /** Mobile viewports (including keyboard-open visual viewport) need the prompt pinned. */
  private isCompactScreen(): boolean {
    const width = Math.min(window.innerWidth, window.visualViewport?.width ?? window.innerWidth);
    return width <= 700;
  }

  private finish(value: string | null): void {
    if (this.settled) return;
    this.settled = true;
    this.resolve(value);
  }

  private submit(): void {
    this.finish(this.input?.getValue() ?? '');
    this.close();
  }

  onClose(): void {
    this.finish(null);
    this.contentEl.empty();
  }
}
