export type ViewMode = "list" | "compact" | "grid";

export type AppPage = "dashboard" | "settings" | "trash" | "activity" | "share";

export type ColorLabel =
  | "none"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "pink";

export const COLOR_LABELS: ColorLabel[] = [
  "none",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
];

export interface Organization {
  id: string;
  name: string;
  initials: string;
  plan: string;
}

export interface Space {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  accentClass: string;
}

export interface SavedItem {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  color: ColorLabel;
  addedAt: string;
  isDeleted?: boolean;
}

export interface Group {
  id: string;
  name: string;
  items: SavedItem[];
}

export interface Collection {
  id: string;
  spaceId: string;
  name: string;
  note: string;
  color: ColorLabel;
  isStarred: boolean;
  groups: Group[];
}

export interface AppData {
  organizations: Organization[];
  spaces: Space[];
  collections: Collection[];
  shareSettings?: ShareSettings[];
}

export type ShareTargetType = "workspace" | "space" | "collection" | "group" | "item";

export type ShareVisibility = "private" | "public" | "members";

export type SharePermission = "view" | "organize";

export interface ShareSettings {
  id: string;
  targetType: ShareTargetType;
  targetId: string;
  visibility: ShareVisibility;
  permission: SharePermission;
  publicSlug: string;
  expiresAt?: string;
  passwordEnabled?: boolean;
  allowCopy?: boolean;
  createdAt: string;
}
