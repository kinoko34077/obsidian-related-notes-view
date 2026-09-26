// view.ts
import { ItemView, WorkspaceLeaf, TFile, App, getAllTags } from "obsidian";
import { VIEW_TYPE_RELATED_NOTES, RelatedNotesSettings } from "./constants";
import { LinkCache } from "obsidian";

const REFRESH_DELAY_MS = 75;

export class RelatedNotesView extends ItemView {
  app: App;
  settings: RelatedNotesSettings;
  private refreshTimer: number | null = null;

  constructor(leaf: WorkspaceLeaf, app: App, settings: RelatedNotesSettings) {
    super(leaf);
    this.app = app;
    this.settings = settings;
  }

  getViewType() {
    return VIEW_TYPE_RELATED_NOTES;
  }

  getDisplayText() {
    return "Related Notes";
  }

  async onOpen() {
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.requestRender())
    );
    this.registerEvent(
      this.app.metadataCache.on("changed", () => this.requestRender())
    );
    this.registerEvent(
      this.app.vault.on("create", () => this.requestRender())
    );
    this.registerEvent(
      this.app.vault.on("delete", () => this.requestRender())
    );
    this.registerEvent(
      this.app.vault.on("rename", () => this.requestRender())
    );
    void this.renderView();
  }

  requestRender() {
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      void this.renderView();
    }, REFRESH_DELAY_MS);
  }

  async renderView() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.setAttr("style", `font-size: ${this.settings.fontSize}; line-height: ${this.settings.lineHeight};`);

    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      container.createEl("p", { text: "No active file." });
      return;
    }

    const metadata = this.app.metadataCache.getFileCache(activeFile);
    let tags: string[] = metadata ? getAllTags(metadata) ?? [] : [];

    if (this.settings.showTagHierarchy) {
      const expanded = new Set<string>();
      for (const tag of tags) {
        const parts = tag.split("/");
        const acc: string[] = [];
        for (const part of parts) {
          acc.push(part);
          expanded.add(acc.join("/"));
        }
      }
      tags = Array.from(expanded);
      tags.sort((a, b) => b.split("/").length - a.split("/").length);
      const unique = new Set<string>();
      tags = tags.filter(tag => {
        if (this.settings.allowTagOverlapOutsideHierarchy) return true;
        const isRedundant = [...unique].some(u => tag.startsWith(u + "/"));
        if (!isRedundant) unique.add(tag);
        return !isRedundant;
      });
    }

    const limitedTags = tags.slice(0, this.settings.tagLimit);
    const allFiles = this.app.vault.getMarkdownFiles();

    this.renderCollapsibleSection(container, "🏷 タグからの関連", (inner) =>
      this.renderTagsSection(inner, limitedTags, activeFile, allFiles)
    );
    if (this.settings.showDividers) container.createEl("hr", { cls: "related-divider" });

    this.renderCollapsibleSection(container, "→ アウトゴーイングリンク", (inner) =>
      this.renderOutgoingLinks(inner, metadata?.links ?? [], activeFile)
    );
    if (this.settings.showDividers) container.createEl("hr", { cls: "related-divider" });

    this.renderCollapsibleSection(container, "← バックリンク", (inner) =>
      this.renderBacklinks(inner, activeFile, allFiles)
    );
  }

  renderCollapsibleSection(container: HTMLElement, title: string, renderContent: (inner: HTMLElement) => void) {
    const details = container.createEl("details", { cls: "related-section" });
    details.setAttr("open", "");
    const cleanedTitle = title.replace(/→|←|🏷/g, "").trim();
    details.createEl("summary", { text: this.settings.headingStyle === "minimal" ? cleanedTitle : title });
    renderContent(details);
  }

  private openFileLink(evt: MouseEvent, file: TFile, sourcePath: string) {
    evt.preventDefault();
    const openInNewLeaf = evt.metaKey || evt.ctrlKey;
    void this.app.workspace.openLinkText(file.path, sourcePath, openInNewLeaf);
  }

  renderTagsSection(container: HTMLElement, tags: string[], activeFile: TFile, allFiles: TFile[]) {
    type TagNode = {
      __children: Record<string, TagNode>;
    };
    const tagTree: Record<string, TagNode> = {};

    // ツリー構造にタグを分解して格納
    for (const tag of tags) {
      const parts = tag.split("/");
      let node = tagTree;
      for (const part of parts) {
        if (!node[part]) node[part] = { __children: {} };
        node = node[part].__children;
      }
    }

    const renderTagNode = (node: Record<string, TagNode>, prefix: string, parentEl: HTMLElement, level = 0) => {
      for (const tag in node) {
        const fullTag = prefix ? `${prefix}/${tag}` : tag;

        const related = allFiles.filter(file => {
          if (file.path === activeFile.path) return false;
          if (this.settings.hiddenNotePaths.includes(file.path)) return false;
          const cache = this.app.metadataCache.getFileCache(file);
          const fileTags: string[] = cache ? getAllTags(cache) ?? [] : [];
          return fileTags.includes(fullTag);
        });

        const sorted = this.settings.randomizeOrder
          ? related.sort(() => Math.random() - 0.5)
          : related.sort((a, b) => b.stat.mtime - a.stat.mtime);

        const limited = sorted.slice(0, this.settings.perTagLinkLimit);

        if (limited.length > 0 || !this.settings.hideTagsWithoutLinks) {
          const details = parentEl.createEl("details", { cls: "tag-section" });
          details.style.marginLeft = `${level * 0.5}rem`;
          details.setAttr("open", "");
          details.createEl("summary", { text: `#${fullTag}` });

          if (limited.length > 0) {
            const list = details.createEl("ul");
            list.style.listStyle = "none";
            limited.forEach((file, index) => {
              const itemClass = index % 2 === 0 ? "even-item" : "odd-item";
              const item = list.createEl("li", { cls: itemClass });
              const link = item.createEl("a", {
                text: file.basename,
                href: file.path,
              });
              link.setAttr("data-href", file.path);
              link.addClass("internal-link");
              link.onclick = (evt) => this.openFileLink(evt, file, activeFile.path);
              link.oncontextmenu = (evt) => {
                evt.preventDefault();
                this.app.workspace.trigger("link-contextmenu", evt, link);
              };
            });
          }

          renderTagNode(node[tag].__children, fullTag, details, level + 1);
        }
      }
    };

    renderTagNode(tagTree, "", container);
  }

  renderOutgoingLinks(container: HTMLElement, links: LinkCache[], activeFile: TFile) {
    const outList = container.createEl("ul");
    let files = links
      .map(link => this.app.metadataCache.getFirstLinkpathDest(link.link, activeFile.path))
      .filter((file): file is TFile => !!file && !this.settings.hiddenNotePaths.includes(file.path));

    files = this.settings.randomizeOrder
      ? files.sort(() => Math.random() - 0.5)
      : files.sort((a, b) => b.stat.mtime - a.stat.mtime);

    files.slice(0, this.settings.outgoingLinkLimit).forEach((file, index) => {
      const itemClass = index % 2 === 0 ? "even-item" : "odd-item";
      const item = outList.createEl("li", { cls: itemClass });
      const linkEl = item.createEl("a", {
        text: file.basename,
        href: file.path,
      });
      linkEl.setAttr("data-href", file.path);
      linkEl.addClass("internal-link");
      linkEl.onclick = (evt) => this.openFileLink(evt, file, activeFile.path);
      linkEl.oncontextmenu = (evt) => {
        evt.preventDefault();
        this.app.workspace.trigger("link-contextmenu", evt, linkEl);
      };
    });
  }

  renderBacklinks(container: HTMLElement, activeFile: TFile, allFiles: TFile[]) {
    const backList = container.createEl("ul");
    let files = allFiles.filter(file => {
      if (file.path === activeFile.path) return false;
      if (this.settings.hiddenNotePaths.includes(file.path)) return false;
      const cache = this.app.metadataCache.getFileCache(file);
      const fileLinks = cache?.links ?? [];
      return fileLinks.some(link => {
        const resolved = this.app.metadataCache.getFirstLinkpathDest(link.link, file.path);
        return resolved?.path === activeFile.path;
      });
    });

    files = this.settings.randomizeOrder
      ? files.sort(() => Math.random() - 0.5)
      : files.sort((a, b) => b.stat.mtime - a.stat.mtime);

    files.slice(0, this.settings.backlinkLimit).forEach((file, index) => {
      const itemClass = index % 2 === 0 ? "even-item" : "odd-item";
      const item = backList.createEl("li", { cls: itemClass });
      const linkEl = item.createEl("a", {
        text: file.basename,
        href: file.path,
      });
      linkEl.setAttr("data-href", file.path);
      linkEl.addClass("internal-link");
      linkEl.onclick = (evt) => this.openFileLink(evt, file, activeFile.path);
      linkEl.oncontextmenu = (evt) => {
        evt.preventDefault();
        this.app.workspace.trigger("link-contextmenu", evt, linkEl);
      };
    });
  }

  async onClose() {
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
