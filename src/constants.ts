// constants.ts
export const VIEW_TYPE_RELATED_NOTES = "related-notes-view";

export interface RelatedNotesSettings {
  // 他の設定項目…
  tagLimit: number;
  tagLinkLimit: number;
  perTagLinkLimit: number;
  outgoingLinkLimit: number;
  backlinkLimit: number;
  randomizeOrder: boolean;
  fontSize: string;
  lineHeight: string;
  hiddenNotePaths: string[];
  showTagHierarchy: boolean;
  showDividers: boolean;
  hideTagsWithoutLinks: boolean;
  headingStyle: "default" | "minimal";
  allowTagOverlapOutsideHierarchy: boolean;
  
}

export const DEFAULT_SETTINGS: RelatedNotesSettings = {
  // 他のデフォルト値…
  tagLimit: 3,
  tagLinkLimit: 5,
  perTagLinkLimit: 5,
  outgoingLinkLimit: 5,
  backlinkLimit: 5,
  randomizeOrder: false,
  fontSize: "14px",
  lineHeight: "1.6",
  hiddenNotePaths: [],
  showTagHierarchy: true,
  showDividers: true,
  hideTagsWithoutLinks: true,
  headingStyle: "default",
  allowTagOverlapOutsideHierarchy: false,
};