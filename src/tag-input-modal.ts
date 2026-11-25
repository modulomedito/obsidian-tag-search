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
  private container: HTMLElement | null = null;

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
    const heading = this.contentEl.createEl('h2', { text: this.title });

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

    if (this.isCompactScreen()) {
      this.pinToTop(heading);
    }
  }

  private isCompactScreen(): boolean {
    const width = Math.min(window.innerWidth, window.visualViewport?.width ?? window.innerWidth);
    return width <= 700;
  }

  /** Obsidian's mobile sheet sits behind the keyboard; inline styles beat its CSS. */
  private pinToTop(heading: HTMLElement): void {
    const set = (name: string, value: string, important = true) =>
      this.modalEl.style.setProperty(name, value, important ? 'important' : '');

    set('position', 'fixed');
    set('top', '12px'); // fallback when env() is unsupported
    set('top', 'calc(env(safe-area-inset-top, 0px) + 12px)');
    set('left', '12px');
    set('right', '12px');
    set('width', 'auto');
    set('max-width', 'none');
    set('max-height', 'none');
    set('margin', '0');
    set('transform', 'none');
    set('overflow', 'visible');

    heading.style.fontSize = '1.15em';
    heading.style.lineHeight = '1.3';
    heading.style.margin = '0 0 12px';

    // A transformed container would turn `fixed` into viewport-relative-to-container.
    const container = this.modalEl.closest('.modal-container') as HTMLElement | null;
    if (container) {
      this.container = container;
      container.style.setProperty('align-items', 'flex-start', 'important');
      container.style.setProperty('transform', 'none', 'important');
    }
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
    if (this.container) {
      this.container.style.removeProperty('align-items');
      this.container.style.removeProperty('transform');
      this.container = null;
    }
    this.finish(null);
    this.contentEl.empty();
  }
}
