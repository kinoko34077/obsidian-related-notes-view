// main.ts
import { Plugin, WorkspaceLeaf } from "obsidian";
import { RelatedNotesView } from "./view";
import { VIEW_TYPE_RELATED_NOTES, DEFAULT_SETTINGS, RelatedNotesSettings } from "./constants";
import { RelatedNotesSettingTab } from "./settings";

export default class RelatedNotesPlugin extends Plugin {
  settings: RelatedNotesSettings;

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.registerView(
      VIEW_TYPE_RELATED_NOTES,
      (leaf: WorkspaceLeaf) => new RelatedNotesView(leaf, this.app, this.settings)
    );

    this.addRibbonIcon("link", "Show Related Notes", async () => {
      const leaf = this.app.workspace.getRightLeaf(false);
      if (!leaf) return;

      await leaf.setViewState({
        type: VIEW_TYPE_RELATED_NOTES,
        active: true,
      });
      this.app.workspace.revealLeaf(leaf);
    });

    this.addSettingTab(new RelatedNotesSettingTab(this.app, this));
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_RELATED_NOTES);
  }
}