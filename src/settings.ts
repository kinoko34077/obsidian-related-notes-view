// settings.ts
import { App, PluginSettingTab, Setting } from "obsidian";
import RelatedNotesPlugin from "./main";

export class RelatedNotesSettingTab extends PluginSettingTab {
  plugin: RelatedNotesPlugin;

  constructor(app: App, plugin: RelatedNotesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Related Notes Settings" });

    new Setting(containerEl)
      .setName("タグ表示上限")
      .setDesc("表示するタグカテゴリ数の最大値")
      .addText(text => text
        .setPlaceholder("例: 3")
        .setValue(this.plugin.settings.tagLimit.toString())
        .onChange(async (value) => {
          this.plugin.settings.tagLimit = parseInt(value) || 0;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("タグごとのリンク上限")
      .addText(text => text
        .setPlaceholder("例: 5")
        .setValue(this.plugin.settings.perTagLinkLimit.toString())
        .onChange(async (value) => {
          this.plugin.settings.tagLinkLimit = parseInt(value) || 0;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("アウトゴーイングリンク上限")
      .addText(text => text
        .setPlaceholder("例: 5")
        .setValue(this.plugin.settings.outgoingLinkLimit.toString())
        .onChange(async (value) => {
          this.plugin.settings.outgoingLinkLimit = parseInt(value) || 0;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("バックリンク上限")
      .addText(text => text
        .setPlaceholder("例: 5")
        .setValue(this.plugin.settings.backlinkLimit.toString())
        .onChange(async (value) => {
          this.plugin.settings.backlinkLimit = parseInt(value) || 0;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("ランダム表示順")
      .setDesc("表示順をランダムにする")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.randomizeOrder)
        .onChange(async (value) => {
          this.plugin.settings.randomizeOrder = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("文字サイズ")
      .setDesc("px単位で指定")
      .addText(text => text
        .setPlaceholder("例: 14px")
        .setValue(this.plugin.settings.fontSize)
        .onChange(async (value) => {
          this.plugin.settings.fontSize = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("行間")
      .setDesc("CSS line-height 値 (例: 1.6)")
      .addText(text => text
        .setPlaceholder("例: 1.6")
        .setValue(this.plugin.settings.lineHeight)
        .onChange(async (value) => {
          this.plugin.settings.lineHeight = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("タグ階層の表示")
      .setDesc("trueで #親/子/孫 タグも階層で表示")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showTagHierarchy)
        .onChange(async (value) => {
          this.plugin.settings.showTagHierarchy = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("セクションごとの区切り線")
      .setDesc("見やすくするための薄い罫線を表示")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showDividers)
        .onChange(async (value) => {
          this.plugin.settings.showDividers = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("リンクのないタグを非表示")
      .setDesc("関連ノートが0件のタグは非表示にします")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.hideTagsWithoutLinks)
        .onChange(async (value) => {
          this.plugin.settings.hideTagsWithoutLinks = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("見出しスタイル")
      .setDesc("参照元の見出し表示スタイル")
      .addDropdown(drop => drop
        .addOption("default", "デフォルト（アイコン付き）")
        .addOption("minimal", "ミニマル（シンプル）")
        .setValue(this.plugin.settings.headingStyle)
        .onChange(async (value) => {
          this.plugin.settings.headingStyle = value as "default" | "minimal";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("非表示ノート (1行1ファイルのパス)")
      .setDesc("この一覧にあるノートはサイドバーに表示されません。")
      .addTextArea(text => {
        text.setPlaceholder("example: folder/note.md")
          .setValue(this.plugin.settings.hiddenNotePaths.join("\n"))
          .onChange(async (value) => {
            this.plugin.settings.hiddenNotePaths = value
              .split("\n")
              .map(s => s.trim())
              .filter(Boolean);
            await this.plugin.saveSettings();
          });
      });
  }
}