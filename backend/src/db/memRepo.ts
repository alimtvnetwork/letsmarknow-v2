import type { OrgRole } from "../types/fastify.js";

export interface MemAccountPreferences {
  default_view?: "list" | "grid" | "compact" | "mindmap" | "column";
  theme?: "system" | "light" | "dark";
  locale?: string;
  timezone?: string;
  layout?: {
    sidebar_width_px?: number;
    right_pane_width_px?: number;
    section_heights_px?: Record<string, number>;
  };
  keyboard_layout?: "qwerty" | "dvorak" | "colemak";
  notifications?: {
    email_digest?: "off" | "daily" | "weekly";
    in_app?: boolean;
  };
  experiments?: Record<string, boolean>;
  [key: string]: unknown;
}

export interface MemAccount {
  id: string;
  email: string;
  passwordHash: string;
  displayName?: string;
  avatarUrl?: string;
  emailVerifiedAt?: Date;
  status: string;
  preferences?: MemAccountPreferences;
  tokensInvalidatedAfter?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface MemOrg {
  id: string;
  name: string;
  slug: string;
  ownerAccountId: string;
  theme?: string;
  brandColor?: string;
  avatarImageUrl?: string;
  defaultSpaceId?: string;
  plan?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface MemMember {
  id: string;
  organizationId: string;
  accountId: string;
  role: OrgRole;
  status: "active" | "pending";
  invitedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemInvite {
  id: string;
  organizationId: string;
  email: string;
  role: OrgRole;
  token: string;
  invitedBy?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemSession {
  id: string;
  accountId: string;
  refreshTokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface MemSpace {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  position: number;
  isPrivate?: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface MemCollection {
  id: string;
  organizationId: string;
  spaceId: string;
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  isStarred?: boolean;
  position: number;
  viewMode?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface MemGroup {
  id: string;
  organizationId: string;
  spaceId?: string;
  collectionId: string;
  name: string;
  position: number;
  color?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface MemItem {
  id: string;
  organizationId: string;
  spaceId?: string;
  collectionId: string;
  groupId?: string | null;
  title: string;
  url: string;
  description?: string | null;
  faviconUrl?: string | null;
  color?: string;
  isStarred?: boolean;
  position: number;
  source?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface MemNextItem {
  id: string;
  accountId: string;
  nextCollectionId: string;
  itemId?: string | null;
  sourceCollectionId?: string | null;
  titleSnapshot: string;
  urlSnapshot: string;
  faviconUrlSnapshot?: string | null;
  position: number;
  isDone: boolean;
  isTombstone: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemTag {
  id: string;
  organizationId: string;
  name: string;
  color: string;
  usageCountCache: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemItemTag {
  itemId: string;
  tagId: string;
}

export interface MemRecentSearch {
  id: string;
  accountId: string;
  organizationId: string;
  query: string;
  resultsCount: number;
  lastUsedAt: Date;
}

export interface MemImportJob {
  id: string;
  organizationId: string;
  accountId: string;
  source: string;
  status: "awaiting_upload" | "queued" | "running" | "succeeded" | "partial" | "failed" | "canceled";
  phase: "parsing" | "previewing" | "awaiting_commit" | "writing_spaces" | "writing_collections" | "writing_items" | "writing_tags" | "finalizing" | "done";
  filename?: string;
  sizeBytes?: number;
  sha256?: string;
  content?: string;
  destination?: {
    kind: "new_space" | "existing_space" | "existing_collection";
    space_name?: string;
    space_id?: string;
    collection_id?: string;
    collection_strategy?: string;
  };
  options?: {
    dedupe_urls?: boolean;
    on_duplicate?: "skip" | "overwrite" | "create_new" | "merge_tags" | "merge_by_url" | "skip_duplicates" | "keep_both";
    tag_prefix?: string;
    preserve_dates?: boolean;
    convert_groups?: boolean;
  };
  parsedSummary?: {
    totals: {
      spaces: number;
      collections: number;
      groups: number;
      items: number;
      tags: number;
    };
    duplicates: {
      by_url_in_org: number;
      by_url_in_destination: number;
      by_canonical_url: number;
    };
    warnings: Array<{ code: string; count?: number; samples?: string[] }>;
    tree: Array<{ kind: string; name: string; items: number; groups: number; sample_items?: Array<{ title: string; url: string }> }>;
    items: Array<{
      url: string;
      title?: string;
      description?: string;
      tags?: string[];
      starred?: boolean;
      spaceName?: string;
      collectionName: string;
      groupName?: string;
      createdAt?: string;
      favicon?: string;
    }>;
  };
  progress: {
    processed: number;
    total: number;
    percent: number;
  };
  summary?: {
    spaces_created: number;
    collections_created: number;
    groups_created: number;
    items_created: number;
    items_skipped_duplicate: number;
    items_failed: number;
    tags_created: number;
  };
  uploadUrl?: string;
  uploadExpiresAt?: Date;
  previewExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  committedAt?: Date;
  finishedAt?: Date;
}

export interface MemExportJob {
  id: string;
  organizationId: string;
  accountId: string;
  format: "lmn_native_json" | "bookmarks_html" | "csv_flat" | "pocket_csv";
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  scope: {
    kind: "organization" | "space" | "collection";
    space_id?: string;
    collection_id?: string;
    include?: string[];
    include_deleted?: boolean;
  };
  options?: {
    include_favicons?: boolean;
    redact_share_passwords?: boolean;
  };
  downloadUrl?: string;
  downloadExpiresAt?: Date;
  sizeBytes?: number;
  sha256?: string;
  itemsCount: number;
  payload?: string;
  createdAt: Date;
  updatedAt: Date;
  finishedAt?: Date;
}

export interface MemShare {
  id: string;
  organizationId: string;
  targetType: "space" | "collection" | "group" | "item";
  targetId: string;
  mode: "public" | "password" | "invite_only";
  passwordHash?: string | null;
  slug: string;
  isCustomSlug?: boolean;
  memorableSlug?: string | null;
  permission: "view" | "organize";
  allowCloneToMyAccount: boolean;
  showBranding: boolean;
  analyticsEnabled: boolean;
  defaultViewMode?: string;
  titleOverride?: string | null;
  descriptionOverride?: string | null;
  allowedEmails: string[];
  expiresAt?: Date | null;
  revokedAt?: Date | null;
  viewCount: number;
  uniqueViewerCount: number;
  clickCount: number;
  lastViewedAt?: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemHistoryEvent {
  id: string;
  organizationId: string;
  accountId?: string | null;
  entityType: "space" | "collection" | "group" | "item" | "tag" | "share" | "member" | "session" | string;
  entityId: string;
  action: string;
  forwardPatch?: Record<string, unknown> | null;
  reversePatch?: Record<string, unknown> | null;
  batchId?: string | null;
  client?: string | null;
  isUndoable: boolean;
  undoneAt?: Date | null;
  undoneByEventId?: string | null;
  redoneAt?: Date | null;
  undoExpiresAt?: Date | null;
  metadata: Record<string, unknown>;
  entitySnapshot?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface MemMindmapNode {
  id: string;
  kind: "item" | "group" | "collection" | "tag" | "note";
  ref_id?: string;
  x: number;
  y: number;
  collapsed?: boolean;
  color?: string | null;
  pinned?: boolean;
}

export interface MemMindmapEdge {
  from: string;
  to: string;
  kind: string;
  label?: string;
  weight?: number;
}

export interface MemMindmapViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface MemMindmapLayout {
  id: string;
  organizationId: string;
  accountId: string;
  scopeType: "space" | "collection" | "group";
  scopeId: string;
  name: string;
  isDefault: boolean;
  sharedWithOrg: boolean;
  viewport: MemMindmapViewport;
  nodes: MemMindmapNode[];
  edges: MemMindmapEdge[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface MemJob {
  id: string;
  organizationId: string;
  createdByAccountId?: string | null;
  kind:
    | "import"
    | "export"
    | "gdpr_export"
    | "bulk_delete"
    | "bulk_move"
    | "mindmap_layout"
    | "share_purge"
    | "license_recompute"
    | "data_migration"
    | "webhook_replay"
    | "link_health"
    | "favicon_fetch"
    | string;
  status: "queued" | "running" | "succeeded" | "partial" | "failed" | "canceled";
  phase?: string | null;
  progress: {
    processed: number;
    total: number;
    percent: number;
  };
  etaSeconds?: number | null;
  resultUrl?: string | null;
  resultSummary?: Record<string, any> | null;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  finishedAt?: Date | null;
  expiresAt: Date;
}

export interface MemLicense {
  id: string;
  organizationId: string;
  accountId: string;
  key: string;
  plan: string;
  tier?: string;
  stackedSeats?: number;
  status: "active" | "lifetime" | "expired" | "revoked";
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemSubscription {
  id: string;
  organizationId: string;
  provider: "stripe" | "paddle";
  customerId: string;
  subscriptionId: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  plan: "free" | "pro" | "team" | "enterprise";
  interval: "month" | "year";
  amountCents: number;
  currency: string;
  seats: number;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemFlag {
  key: string;
  description?: string;
  type: "boolean" | "multivariate" | "percentage";
  defaultValue: string;
  rolloutPct?: number;
  variants?: Record<string, any>;
  targeting?: {
    accountIds?: string[];
    orgIds?: string[];
    plans?: string[];
    minVersion?: string;
  };
  isKillswitch?: boolean;
}

export class InMemoryRepository {
  accounts = new Map<string, MemAccount>(); // email -> account
  organizations = new Map<string, MemOrg>(); // id -> org
  members: MemMember[] = [];
  invites: MemInvite[] = [];
  sessions = new Map<string, MemSession>(); // hash -> session
  verificationTokens = new Map<string, string>(); // token -> accountId
  spaces: MemSpace[] = [];
  collections: MemCollection[] = [];
  groups: MemGroup[] = [];
  items: MemItem[] = [];
  tags: MemTag[] = [];
  itemTags: MemItemTag[] = [];
  recentSearches: MemRecentSearch[] = [];
  imports: MemImportJob[] = [];
  exports: MemExportJob[] = [];
  shares: MemShare[] = [];
  historyEvents: MemHistoryEvent[] = [];
  mindmapLayouts: MemMindmapLayout[] = [];
  jobs: MemJob[] = [];
  licenses: MemLicense[] = [];
  subscriptions: MemSubscription[] = [];
  nextItems: MemNextItem[] = [];
  flags: Map<string, MemFlag> = new Map();

  constructor() {
    this.initDefaultFlags();
  }

  initDefaultFlags() {
    this.flags.clear();
    this.flags.set("mindmap_v2", {
      key: "mindmap_v2",
      description: "Next-gen SVG interactive mindmap visual layout engine",
      type: "boolean",
      defaultValue: "on",
      rolloutPct: 100,
    });
    this.flags.set("ai_assist", {
      key: "ai_assist",
      description: "Generative AI bookmark tagging & auto-summarization",
      type: "boolean",
      defaultValue: "off",
      rolloutPct: 0,
      targeting: {
        plans: ["pro", "team", "enterprise"],
      },
    });
    this.flags.set("share_password_v2", {
      key: "share_password_v2",
      description: "Argon2-powered password protected share portal",
      type: "multivariate",
      defaultValue: "control",
      variants: {
        control: { ui: "v1" },
        treatment: { ui: "v2" },
      },
      rolloutPct: 50,
    });
    this.flags.set("dashboard.column_view.enabled", {
      key: "dashboard.column_view.enabled",
      description: "Kanban / column board view for collection workspaces",
      type: "boolean",
      defaultValue: "on",
      rolloutPct: 100,
    });
    this.flags.set("safety.share_revoke.kill_switch", {
      key: "safety.share_revoke.kill_switch",
      description: "Emergency kill switch for instant share link revocation",
      type: "boolean",
      defaultValue: "off",
      isKillswitch: true,
    });
  }

  clear() {
    this.accounts.clear();
    this.organizations.clear();
    this.members = [];
    this.invites = [];
    this.sessions.clear();
    this.verificationTokens.clear();
    this.spaces = [];
    this.collections = [];
    this.groups = [];
    this.items = [];
    this.tags = [];
    this.itemTags = [];
    this.recentSearches = [];
    this.imports = [];
    this.exports = [];
    this.shares = [];
    this.historyEvents = [];
    this.mindmapLayouts = [];
    this.jobs = [];
    this.licenses = [];
    this.subscriptions = [];
    this.nextItems = [];
    this.initDefaultFlags();
  }

  getAccountById(id: string): MemAccount | undefined {
    for (const acc of this.accounts.values()) {
      if (acc.id === id) return acc;
    }
    return undefined;
  }
}

export const memRepo = new InMemoryRepository();
