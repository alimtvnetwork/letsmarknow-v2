import { api } from "./apiClient";

export interface BackendSpace {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  position: number;
  is_starred: boolean;
  visibility: "private" | "org";
  collection_count: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendCollection {
  id: string;
  space_id: string;
  organization_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  color: string;
  position: number;
  is_starred: boolean;
  default_view_mode: "list" | "grid" | "compact" | "mindmap" | "column";
  item_count_cache: number;
  group_count_cache: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendGroup {
  id: string;
  collection_id: string;
  space_id: string | null;
  organization_id: string;
  name: string;
  color: string;
  position: number;
  is_starred: boolean;
  is_hidden: boolean;
  item_count_cache: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Envelope<T> {
  data: T;
}

// ===================== SPACES =====================
export async function fetchBackendSpaces(): Promise<BackendSpace[]> {
  const res = await api.get<Envelope<BackendSpace[]>>("/spaces");
  return res.data;
}

export async function createBackendSpace(params: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  visibility?: "private" | "org";
}): Promise<BackendSpace> {
  const res = await api.post<Envelope<BackendSpace>>("/spaces", params);
  return res.data;
}

export async function updateBackendSpace(
  spaceId: string,
  params: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    visibility?: "private" | "org";
  }
): Promise<BackendSpace> {
  const res = await api.patch<Envelope<BackendSpace>>(`/spaces/${spaceId}`, params);
  return res.data;
}

export async function deleteBackendSpace(spaceId: string): Promise<void> {
  await api.delete(`/spaces/${spaceId}`);
}

// ===================== COLLECTIONS =====================
export async function fetchBackendCollections(spaceId?: string): Promise<BackendCollection[]> {
  const url = spaceId ? `/collections?space_id=${spaceId}` : "/collections";
  const res = await api.get<Envelope<BackendCollection[]>>(url);
  return res.data;
}

export async function createBackendCollection(params: {
  spaceId: string;
  name: string;
  description?: string;
  color?: string;
  viewMode?: "list" | "grid" | "compact" | "mindmap" | "column";
}): Promise<BackendCollection> {
  const res = await api.post<Envelope<BackendCollection>>("/collections", {
    space_id: params.spaceId,
    name: params.name,
    description: params.description,
    color: params.color,
    view_mode: params.viewMode,
  });
  return res.data;
}

export async function updateBackendCollection(
  collectionId: string,
  params: {
    name?: string;
    description?: string;
    color?: string;
    isStarred?: boolean;
    viewMode?: "list" | "grid" | "compact" | "mindmap" | "column";
  }
): Promise<BackendCollection> {
  const res = await api.patch<Envelope<BackendCollection>>(`/collections/${collectionId}`, {
    name: params.name,
    description: params.description,
    color: params.color,
    is_starred: params.isStarred,
    view_mode: params.viewMode,
  });
  return res.data;
}

export async function moveBackendCollection(
  collectionId: string,
  toSpaceId: string
): Promise<BackendCollection> {
  const res = await api.post<Envelope<BackendCollection>>(`/collections/${collectionId}/move`, {
    to_space_id: toSpaceId,
  });
  return res.data;
}

export async function deleteBackendCollection(collectionId: string): Promise<void> {
  await api.delete(`/collections/${collectionId}`);
}

// ===================== GROUPS =====================
export async function fetchBackendGroups(collectionId: string): Promise<BackendGroup[]> {
  const res = await api.get<Envelope<BackendGroup[]>>(`/groups?collection_id=${collectionId}`);
  return res.data;
}

export async function createBackendGroup(params: {
  collectionId: string;
  name: string;
  color?: string;
}): Promise<BackendGroup> {
  const res = await api.post<Envelope<BackendGroup>>("/groups", {
    collection_id: params.collectionId,
    name: params.name,
    color: params.color,
  });
  return res.data;
}

export async function updateBackendGroup(
  groupId: string,
  params: {
    name?: string;
    color?: string;
    position?: number;
  }
): Promise<BackendGroup> {
  const res = await api.patch<Envelope<BackendGroup>>(`/groups/${groupId}`, params);
  return res.data;
}

export async function deleteBackendGroup(groupId: string): Promise<void> {
  await api.delete(`/groups/${groupId}`);
}

// ===================== ITEMS =====================
export interface BackendItem {
  id: string;
  collection_id: string;
  group_id: string | null;
  space_id: string | null;
  organization_id: string;
  title: string;
  url: string;
  domain: string;
  description: string | null;
  favicon_url: string | null;
  color: string;
  position: number;
  is_starred: boolean;
  source: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchBackendItems(options: {
  collectionId?: string;
  groupId?: string;
  includeGroups?: boolean;
  isStarred?: boolean;
  q?: string;
}): Promise<BackendItem[]> {
  const params = new URLSearchParams();
  if (options.collectionId) params.append("collection_id", options.collectionId);
  if (options.groupId) params.append("group_id", options.groupId);
  if (options.includeGroups) params.append("include_groups", "true");
  if (options.isStarred !== undefined) params.append("is_starred", String(options.isStarred));
  if (options.q) params.append("q", options.q);

  const res = await api.get<Envelope<BackendItem[]>>(`/items?${params.toString()}`);
  return res.data;
}

export async function createBackendItem(params: {
  collectionId?: string;
  groupId?: string;
  url: string;
  title?: string;
  description?: string;
  color?: string;
  source?: string;
}): Promise<BackendItem> {
  const res = await api.post<Envelope<BackendItem>>("/items", {
    collection_id: params.collectionId,
    group_id: params.groupId,
    url: params.url,
    title: params.title,
    description: params.description,
    color: params.color,
    source: params.source,
  });
  return res.data;
}

export async function updateBackendItem(
  itemId: string,
  params: {
    title?: string;
    url?: string;
    description?: string;
    color?: string;
    isStarred?: boolean;
    position?: number;
  }
): Promise<BackendItem> {
  const res = await api.patch<Envelope<BackendItem>>(`/items/${itemId}`, {
    title: params.title,
    url: params.url,
    description: params.description,
    color: params.color,
    is_starred: params.isStarred,
    position: params.position,
  });
  return res.data;
}

export async function moveBackendItem(
  itemId: string,
  params: {
    toCollectionId?: string;
    toGroupId?: string;
  }
): Promise<BackendItem> {
  const res = await api.post<Envelope<BackendItem>>(`/items/${itemId}/move`, {
    to_collection_id: params.toCollectionId,
    to_group_id: params.toGroupId,
  });
  return res.data;
}

export async function starBackendItem(itemId: string): Promise<void> {
  await api.post(`/items/${itemId}/star`, {});
}

export async function unstarBackendItem(itemId: string): Promise<void> {
  await api.post(`/items/${itemId}/unstar`, {});
}

export async function deleteBackendItem(itemId: string): Promise<void> {
  await api.delete(`/items/${itemId}`);
}

export async function restoreBackendItem(itemId: string): Promise<BackendItem> {
  const res = await api.post<Envelope<BackendItem>>(`/items/${itemId}/restore`, {});
  return res.data;
}

// ===================== SESSIONS SAVE =====================
export interface SessionSaveResult {
  destination: {
    kind: "new_collection" | "existing_collection" | "new_group" | "existing_group";
    collection_id?: string;
    group_id?: string | null;
  };
  items_created: number;
  items_skipped: number;
  items_failed: number;
  skipped: Array<{ url: string; reason: string }>;
  history_event_id: string;
  undo_token: string;
}

export interface SessionPreviewResult {
  would_create: number;
  would_skip: number;
  skipped: Array<{ url: string; reason: string }>;
  destination_resolved: {
    kind: string;
    name: string;
  };
  entitlement_blocking: boolean;
}

export async function saveSessionToBackend(payload: {
  destination: {
    kind: "new_collection" | "existing_collection" | "new_group" | "existing_group";
    space_id?: string;
    collection_id?: string;
    group_id?: string;
    name?: string;
    color?: string;
  };
  tabs: Array<{
    url: string;
    title?: string;
    favicon_data_url?: string;
    pinned?: boolean;
    active?: boolean;
    window_position?: number;
  }>;
  options?: {
    close_tabs_after_save?: boolean;
    exclude_pinned?: boolean;
    exclude_chrome_internal?: boolean;
    dedupe_within_session?: boolean;
    dedupe_against_collection?: boolean;
  };
  client?: {
    window_id?: number;
    extension_version?: string;
    browser?: string;
  };
}): Promise<SessionSaveResult> {
  const res = await api.post<Envelope<SessionSaveResult>>("/sessions/save", payload);
  return res.data;
}

export async function previewSessionSave(payload: {
  destination: {
    kind: "new_collection" | "existing_collection" | "new_group" | "existing_group";
    space_id?: string;
    collection_id?: string;
    group_id?: string;
    name?: string;
    color?: string;
  };
  tabs: Array<{
    url: string;
    title?: string;
    favicon_data_url?: string;
    pinned?: boolean;
    active?: boolean;
    window_position?: number;
  }>;
  options?: {
    close_tabs_after_save?: boolean;
    exclude_pinned?: boolean;
    exclude_chrome_internal?: boolean;
    dedupe_within_session?: boolean;
    dedupe_against_collection?: boolean;
  };
}): Promise<SessionPreviewResult> {
  const res = await api.post<Envelope<SessionPreviewResult>>("/sessions/save/preview", payload);
  return res.data;
}

// ===================== TAGS =====================
export interface BackendTag {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  color: string;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TagSuggestion {
  id: string | null;
  name: string;
  color: string | null;
  match: "prefix" | "create_new";
}

export async function fetchBackendTags(options?: {
  q?: string;
  sort?: "name" | "-usage_count" | "-created_at";
  limit?: number;
}): Promise<BackendTag[]> {
  const params = new URLSearchParams();
  if (options?.q) params.append("q", options.q);
  if (options?.sort) params.append("sort", options.sort);
  if (options?.limit) params.append("limit", String(options.limit));

  const url = params.toString() ? `/tags?${params.toString()}` : "/tags";
  const res = await api.get<Envelope<BackendTag[]>>(url);
  return res.data;
}

export async function createBackendTag(params: {
  name: string;
  color?: string;
  description?: string;
}): Promise<BackendTag> {
  const res = await api.post<Envelope<BackendTag>>("/tags", params);
  return res.data;
}

export async function updateBackendTag(
  tagId: string,
  params: {
    name?: string;
    color?: string;
    description?: string;
  }
): Promise<BackendTag> {
  const res = await api.patch<Envelope<BackendTag>>(`/tags/${tagId}`, params);
  return res.data;
}

export async function deleteBackendTag(tagId: string): Promise<void> {
  await api.delete(`/tags/${tagId}`);
}

export async function suggestBackendTags(q: string, limit?: number): Promise<TagSuggestion[]> {
  const params = new URLSearchParams({ q });
  if (limit) params.append("limit", String(limit));
  const res = await api.get<Envelope<TagSuggestion[]>>(`/tags/suggest?${params.toString()}`);
  return res.data;
}

export async function setItemBackendTags(
  itemId: string,
  payload: {
    add?: string[];
    remove?: string[];
    create?: Array<{ name: string; color?: string }>;
  }
): Promise<{ item_id: string; tag_ids: string[] }> {
  const res = await api.post<Envelope<{ item_id: string; tag_ids: string[] }>>(
    `/items/${itemId}/tags`,
    payload
  );
  return res.data;
}

// ===================== BULK OPERATIONS (207 MULTI-STATUS) =====================
export interface BulkOperationInput {
  op: "create" | "update" | "move" | "delete" | "star" | "tag";
  id?: string;
  data?: Record<string, unknown>;
  if_match?: string;
}

export interface BulkResultItem {
  index: number;
  status: number;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

export interface BulkItemsResponse {
  results: BulkResultItem[];
}

export async function executeBulkItems(
  operations: BulkOperationInput[],
  allOrNothing = false
): Promise<BulkItemsResponse> {
  const res = await api.post<Envelope<BulkItemsResponse>>("/bulk/items", {
    all_or_nothing: allOrNothing,
    operations,
  });
  return res.data;
}

// ===================== SEARCH =====================
export interface GlobalSearchResultItem {
  type: "item" | "collection" | "group" | "tag";
  id: string;
  title?: string;
  name?: string;
  url?: string;
  favicon_url?: string | null;
  collection?: { id: string; name: string; color: string } | null;
  score: number;
  highlight?: Record<string, string>;
}

export interface GlobalSearchResponse {
  data: GlobalSearchResultItem[];
  page: { next_cursor: string | null; has_more: boolean; limit: number };
  meta: {
    took_ms: number;
    parsed_query: {
      terms: string[];
      filters: Record<string, unknown>;
    };
  };
}

export interface QuickSearchResultItem {
  id: string;
  title: string;
  url: string;
  favicon_url: string | null;
  collection_name: string;
  score: number;
}

export interface SearchSuggestions {
  queries: string[];
  tags: Array<{ id: string; name: string }>;
  collections: Array<{ id: string; name: string }>;
  domains: string[];
}

export interface RecentSearchItem {
  q: string;
  last_used_at: string;
  results_count: number;
}

export async function searchGlobal(
  q: string,
  options?: { types?: string[]; limit?: number; highlight?: boolean }
): Promise<GlobalSearchResponse> {
  const params = new URLSearchParams({ q });
  if (options?.types) params.append("types", options.types.join(","));
  if (options?.limit) params.append("limit", String(options.limit));
  if (options?.highlight !== undefined) params.append("highlight", String(options.highlight));

  return api.get<GlobalSearchResponse>(`/search?${params.toString()}`);
}

export async function searchQuick(
  q: string,
  limit?: number
): Promise<QuickSearchResultItem[]> {
  const params = new URLSearchParams({ q });
  if (limit) params.append("limit", String(limit));

  const res = await api.get<Envelope<QuickSearchResultItem[]>>(`/search/quick?${params.toString()}`);
  return res.data;
}

export async function searchSuggest(
  q: string,
  limit?: number
): Promise<SearchSuggestions> {
  const params = new URLSearchParams({ q });
  if (limit) params.append("limit", String(limit));

  const res = await api.get<Envelope<SearchSuggestions>>(`/search/suggest?${params.toString()}`);
  return res.data;
}

export async function fetchRecentSearches(): Promise<RecentSearchItem[]> {
  const res = await api.get<Envelope<RecentSearchItem[]>>("/search/recent");
  return res.data;
}

export async function deleteRecentSearches(q?: string): Promise<void> {
  const url = q ? `/search/recent?q=${encodeURIComponent(q)}` : "/search/recent";
  await api.delete(url);
}

// ===================== IMPORT & EXPORT =====================
export interface ImportJobResponse {
  import_id: string;
  source?: string;
  status: "awaiting_upload" | "queued" | "running" | "succeeded" | "partial" | "failed" | "canceled";
  size_bytes?: number;
  sha256?: string;
  preview_url?: string;
  created_at?: string;
  finished_at?: string | null;
}

export interface ImportPreviewResponse {
  import_id: string;
  source: string;
  parsed_at: string;
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
  tree: Array<{
    kind: string;
    name: string;
    items: number;
    groups: number;
    sample_items?: Array<{ title: string; url: string }>;
  }>;
  expires_at?: string;
}

export interface ImportStatusResponse {
  import_id: string;
  status: string;
  phase?: string;
  progress?: { processed: number; total: number; percent: number };
  summary?: {
    spaces_created: number;
    collections_created: number;
    groups_created: number;
    items_created: number;
    items_skipped_duplicate: number;
    items_failed: number;
    tags_created: number;
  };
  committed_at?: string;
  updated_at?: string;
}

export interface ExportJobResponse {
  export_id: string;
  status: string;
  estimated_completion_at?: string;
}

export interface ExportStatusResponse {
  export_id: string;
  status: string;
  format: "lmn_native_json" | "bookmarks_html" | "csv_flat" | "pocket_csv";
  download_url: string;
  download_expires_at?: string;
  size_bytes?: number;
  sha256?: string;
  items_count: number;
}

export interface ExportDetailResponse {
  export_id: string;
  format: string;
  status: string;
  size_bytes: number;
  items_count: number;
  download_url: string;
  created_at: string;
}

export async function uploadImport(
  content: string,
  params: {
    source?: string;
    filename?: string;
    destination?: {
      kind?: "new_space" | "existing_space" | "existing_collection";
      space_name?: string;
      space_id?: string;
      collection_id?: string;
    };
    options?: {
      dedupe_urls?: boolean;
      on_duplicate?: "skip" | "overwrite" | "create_new" | "merge_tags" | "merge_by_url" | "skip_duplicates" | "keep_both";
      tag_prefix?: string;
      preserve_dates?: boolean;
    };
  } = {}
): Promise<ImportJobResponse> {
  const res = await api.post<Envelope<ImportJobResponse>>("/imports/upload", {
    file_content: content,
    source: params.source,
    filename: params.filename,
    destination: params.destination,
    options: params.options,
  });
  return res.data;
}

export async function fetchImportPreview(importId: string): Promise<ImportPreviewResponse> {
  const res = await api.get<Envelope<ImportPreviewResponse>>(`/imports/${importId}/preview`);
  return res.data;
}

export async function fetchImportStatus(importId: string): Promise<ImportStatusResponse> {
  const res = await api.get<Envelope<ImportStatusResponse>>(`/imports/${importId}/status`);
  return res.data;
}

export async function commitImport(
  importId: string,
  params: {
    destination?: {
      kind?: "new_space" | "existing_space" | "existing_collection";
      space_name?: string;
      space_id?: string;
      collection_id?: string;
    };
    options?: {
      dedupe_urls?: boolean;
      on_duplicate?: "skip" | "overwrite" | "create_new" | "merge_tags" | "merge_by_url" | "skip_duplicates" | "keep_both";
      tag_prefix?: string;
      preserve_dates?: boolean;
    };
  } = {}
): Promise<ImportStatusResponse> {
  const res = await api.post<Envelope<ImportStatusResponse>>(`/imports/${importId}/commit`, params);
  return res.data;
}

export async function cancelImport(importId: string): Promise<void> {
  await api.post(`/imports/${importId}/cancel`);
}

export async function fetchImportsList(limit = 20): Promise<ImportJobResponse[]> {
  const res = await api.get<Envelope<ImportJobResponse[]>>(`/imports?limit=${limit}`);
  return res.data;
}

export async function createBackendExport(params: {
  format: "lmn_native_json" | "bookmarks_html" | "csv_flat" | "pocket_csv";
  scope?: {
    kind?: "organization" | "space" | "collection";
    space_id?: string;
    collection_id?: string;
    include_deleted?: boolean;
  };
  options?: {
    include_favicons?: boolean;
    redact_share_passwords?: boolean;
  };
}): Promise<ExportJobResponse> {
  const res = await api.post<Envelope<ExportJobResponse>>("/exports", params);
  return res.data;
}

export async function fetchExportStatus(exportId: string): Promise<ExportStatusResponse> {
  const res = await api.get<Envelope<ExportStatusResponse>>(`/exports/${exportId}`);
  return res.data;
}

export async function fetchExportsList(limit = 20): Promise<ExportDetailResponse[]> {
  const res = await api.get<Envelope<ExportDetailResponse[]>>(`/exports?limit=${limit}`);
  return res.data;
}

// ===================== SHARES (STEP 11) =====================
export interface BackendShare {
  id: string;
  slug: string;
  url: string;
  target_type: "space" | "collection" | "group" | "item";
  target_id: string;
  organization_id: string;
  mode: "public" | "password" | "invite_only";
  created_by: string | null;
  title_override: string | null;
  description_override: string | null;
  expires_at: string | null;
  allow_clone_to_my_account: boolean;
  show_branding: boolean;
  analytics_enabled: boolean;
  default_view_mode: string;
  password_set: boolean;
  allowed_emails: string[];
  view_count: number;
  unique_viewer_count: number;
  click_count: number;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicShareMetadata {
  slug: string;
  mode: "public" | "password" | "invite_only";
  target_type: "space" | "collection" | "group" | "item";
  title: string;
  description: string | null;
  owner: {
    organization_name: string;
    avatar_token: string;
    avatar_color: string;
    avatar_image_url: string | null;
    show_branding: boolean;
  };
  expires_at: string | null;
  requires_password: boolean;
  requires_invite_auth: boolean;
  allow_clone_to_my_account: boolean;
  analytics_enabled: boolean;
  meta: {
    title: string | null;
    description: string | null;
    image_url: string | null;
  };
}

export interface PublicShareContentsResponse {
  slug: string;
  target_type: string;
  target: {
    id: string;
    name?: string;
    title?: string;
    color?: string;
    description?: string | null;
    url?: string;
  };
  groups: Array<{
    id: string;
    name: string;
    color?: string;
    items: Array<{
      id: string;
      title: string;
      url: string;
      favicon_url?: string | null;
      description?: string | null;
    }>;
  }>;
  items: Array<{
    id: string;
    title: string;
    url: string;
    favicon_url?: string | null;
    description?: string | null;
  }>;
}

export async function fetchBackendShares(params: {
  space_id?: string;
  collection_id?: string;
  group_id?: string;
  item_id?: string;
  include_revoked?: boolean;
}): Promise<BackendShare[]> {
  const query = new URLSearchParams();
  if (params.space_id) query.set("space_id", params.space_id);
  if (params.collection_id) query.set("collection_id", params.collection_id);
  if (params.group_id) query.set("group_id", params.group_id);
  if (params.item_id) query.set("item_id", params.item_id);
  if (params.include_revoked) query.set("include_revoked", "true");

  const qs = query.toString();
  const res = await api.get<Envelope<BackendShare[]>>(`/shares${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function createBackendShare(params: {
  target_type: "space" | "collection" | "group" | "item";
  target_id: string;
  mode?: "public" | "password" | "invite_only";
  slug?: string | null;
  title_override?: string | null;
  description_override?: string | null;
  expires_at?: string | null;
  password?: string | null;
  allowed_emails?: string[];
  allow_clone_to_my_account?: boolean;
  show_branding?: boolean;
  analytics_enabled?: boolean;
  default_view_mode?: string;
}): Promise<BackendShare> {
  const res = await api.post<Envelope<BackendShare>>("/shares", params);
  return res.data;
}

export async function publishBackendShare(params: {
  name: string;
  description?: string | null;
  slug?: string | null;
  mode?: "public" | "password" | "invite_only";
  password?: string | null;
  groups?: Array<{
    name: string;
    color?: string;
    items?: Array<{
      title: string;
      url: string;
      description?: string | null;
      favicon_url?: string | null;
      tags?: string[];
    }>;
  }>;
  items?: Array<{
    title: string;
    url: string;
    description?: string | null;
    favicon_url?: string | null;
    tags?: string[];
  }>;
}): Promise<BackendShare> {
  const res = await api.post<Envelope<BackendShare>>("/shares/publish", params);
  return res.data;
}

export async function fetchBackendShare(shareId: string): Promise<BackendShare> {
  const res = await api.get<Envelope<BackendShare>>(`/shares/${shareId}`);
  return res.data;
}

export async function updateBackendShare(
  shareId: string,
  params: {
    mode?: "public" | "password" | "invite_only";
    title_override?: string | null;
    description_override?: string | null;
    expires_at?: string | null;
    password?: string | null;
    allowed_emails?: string[];
    allow_clone_to_my_account?: boolean;
    show_branding?: boolean;
    analytics_enabled?: boolean;
    default_view_mode?: string;
  }
): Promise<BackendShare> {
  const res = await api.patch<Envelope<BackendShare>>(`/shares/${shareId}`, params);
  return res.data;
}

export async function rotateBackendShareSlug(
  shareId: string,
  newSlug?: string | null
): Promise<BackendShare> {
  const res = await api.post<Envelope<BackendShare>>(`/shares/${shareId}/rotate-slug`, {
    new_slug: newSlug,
  });
  return res.data;
}

export async function revokeBackendShare(shareId: string): Promise<BackendShare> {
  const res = await api.post<Envelope<BackendShare>>(`/shares/${shareId}/revoke`);
  return res.data;
}

export async function restoreBackendShare(shareId: string): Promise<BackendShare> {
  const res = await api.post<Envelope<BackendShare>>(`/shares/${shareId}/restore`);
  return res.data;
}

export async function purgeBackendShare(
  shareId: string,
  confirmSlug: string
): Promise<{ share_id: string; slug_at_purge: string; purged_at: string }> {
  const res = await api.post<Envelope<{ share_id: string; slug_at_purge: string; purged_at: string }>>(
    `/shares/${shareId}/purge`,
    { confirm_slug: confirmSlug }
  );
  return res.data;
}

export async function fetchPublicShareMetadata(slug: string): Promise<PublicShareMetadata> {
  const res = await api.get<Envelope<PublicShareMetadata>>(`/public/shares/${slug}`);
  return res.data;
}

export async function unlockPublicShare(
  slug: string,
  password: string
): Promise<{ unlocked: boolean; expires_in: number }> {
  const res = await api.post<Envelope<{ unlocked: boolean; expires_in: number }>>(
    `/public/shares/${slug}/unlock`,
    { password }
  );
  return res.data;
}

export async function fetchPublicShareContents(
  slug: string,
  options: { view?: string; expand?: string } = {}
): Promise<PublicShareContentsResponse> {
  const query = new URLSearchParams();
  if (options.view) query.set("view", options.view);
  if (options.expand) query.set("expand", options.expand);

  const qs = query.toString();
  const res = await api.get<Envelope<PublicShareContentsResponse>>(
    `/public/shares/${slug}/contents${qs ? `?${qs}` : ""}`
  );
  return res.data;
}

// ===================== HISTORY & TRASH =====================

export interface BackendHistoryEvent {
  id: string;
  organization_id: string;
  user_id: string;
  batch_id: string | null;
  client: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  is_undoable: boolean;
  undone_at: string | null;
  redone_at: string | null;
  undo_expires_at: string | null;
  metadata: Record<string, any> | null;
  entity_snapshot: Record<string, any> | null;
  created_at: string;
}

export interface BackendTrashItem {
  id: string;
  organization_id: string;
  entity_type: "item" | "group" | "collection" | "space";
  title: string;
  url?: string | null;
  color?: string | null;
  icon?: string | null;
  deleted_at: string;
  purges_at: string;
  collection_id?: string | null;
  space_id?: string | null;
}

export interface HistoryUndoResponse {
  undone_event_id: string;
  undone_at: string;
  entities_affected: number;
  batch_id: string | null;
}

export interface HistoryRedoResponse {
  redone_event_id: string;
  redone_at: string;
  entities_affected: number;
  batch_id: string | null;
}

export interface TrashBatchResponse {
  restored_count?: number;
  restored_ids?: string[];
  purged_count?: number;
  purged_ids?: string[];
  emptied_count?: number;
}

export async function fetchBackendHistory(params?: {
  entity_type?: string;
  entity_id?: string;
  event_type?: string;
  limit?: number;
  before?: string;
}): Promise<BackendHistoryEvent[]> {
  const query = new URLSearchParams();
  if (params?.entity_type) query.set("entity_type", params.entity_type);
  if (params?.entity_id) query.set("entity_id", params.entity_id);
  if (params?.event_type) query.set("event_type", params.event_type);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.before) query.set("before", params.before);

  const qs = query.toString();
  const res = await api.get<Envelope<BackendHistoryEvent[]>>(`/history${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function fetchBackendHistoryEvent(id: string): Promise<BackendHistoryEvent> {
  const res = await api.get<Envelope<BackendHistoryEvent>>(`/history/${id}`);
  return res.data;
}

export async function undoBackendHistoryEvent(
  eventId: string,
  undoEntireBatch?: boolean
): Promise<HistoryUndoResponse> {
  const res = await api.post<Envelope<HistoryUndoResponse>>(`/history/${eventId}/undo`, {
    undo_entire_batch: undoEntireBatch,
  });
  return res.data;
}

export async function redoBackendHistoryEvent(
  eventId: string
): Promise<HistoryRedoResponse> {
  const res = await api.post<Envelope<HistoryRedoResponse>>(`/history/${eventId}/redo`);
  return res.data;
}

export async function fetchBackendTrash(params?: {
  entity_type?: string;
  limit?: number;
}): Promise<BackendTrashItem[]> {
  const query = new URLSearchParams();
  if (params?.entity_type) query.set("entity_type", params.entity_type);
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  const res = await api.get<Envelope<BackendTrashItem[]>>(`/trash${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function restoreBackendTrash(
  entityIds: string[]
): Promise<TrashBatchResponse> {
  const res = await api.post<Envelope<TrashBatchResponse>>("/trash/restore", {
    entity_ids: entityIds,
  });
  return res.data;
}

export async function purgeBackendTrash(
  entityIds: string[]
): Promise<TrashBatchResponse> {
  const res = await api.post<Envelope<TrashBatchResponse>>("/trash/purge", {
    entity_ids: entityIds,
  });
  return res.data;
}

export async function emptyBackendTrash(): Promise<TrashBatchResponse> {
  const res = await api.post<Envelope<TrashBatchResponse>>("/trash/empty");
  return res.data;
}

// ===================== MINDMAP LAYOUTS =====================

export interface BackendMindmapNode {
  id: string;
  kind: "item" | "group" | "collection" | "tag" | "note";
  ref_id?: string;
  x: number;
  y: number;
  collapsed?: boolean;
  color?: string | null;
  pinned?: boolean;
}

export interface BackendMindmapEdge {
  from: string;
  to: string;
  kind: string;
  label?: string;
  weight?: number;
}

export interface BackendMindmapViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface BackendMindmapLayoutSummary {
  id: string;
  name: string;
  scope_type: "space" | "collection" | "group";
  scope_id: string;
  is_default: boolean;
  node_count: number;
  created_by_account_id: string;
  shared_with_org: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendMindmapLayout {
  id: string;
  name: string;
  scope_type: "space" | "collection" | "group";
  scope_id: string;
  is_default: boolean;
  viewport: BackendMindmapViewport;
  nodes: BackendMindmapNode[];
  edges: BackendMindmapEdge[];
  created_by_account_id: string;
  shared_with_org: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeleteMindmapLayoutResponse {
  id: string;
  deleted_at: string;
  was_default: boolean;
  new_default_id: string | null;
  already_deleted?: boolean;
}

export async function fetchBackendMindmapLayouts(params: {
  scope_type: "space" | "collection" | "group";
  scope_id: string;
  include_shared?: boolean;
}): Promise<BackendMindmapLayoutSummary[]> {
  const query = new URLSearchParams();
  query.set("scope_type", params.scope_type);
  query.set("scope_id", params.scope_id);
  if (params.include_shared !== undefined) {
    query.set("include_shared", String(params.include_shared));
  }

  const res = await api.get<{ data: BackendMindmapLayoutSummary[] }>(
    `/mindmap-layouts?${query.toString()}`
  );
  return res.data;
}

export async function fetchBackendMindmapLayout(
  id: string
): Promise<BackendMindmapLayout> {
  const res = await api.get<Envelope<BackendMindmapLayout>>(`/mindmap-layouts/${id}`);
  return res.data;
}

export async function createBackendMindmapLayout(params: {
  name: string;
  scope_type: "space" | "collection" | "group";
  scope_id: string;
  is_default?: boolean;
  shared_with_org?: boolean;
  viewport?: BackendMindmapViewport;
  nodes?: BackendMindmapNode[];
  edges?: BackendMindmapEdge[];
}): Promise<BackendMindmapLayout> {
  const res = await api.post<Envelope<BackendMindmapLayout>>("/mindmap-layouts", params);
  return res.data;
}

export async function updateBackendMindmapLayout(
  id: string,
  params: {
    name?: string;
    is_default?: boolean;
    shared_with_org?: boolean;
    viewport?: BackendMindmapViewport;
    nodes?: BackendMindmapNode[];
    edges?: BackendMindmapEdge[];
  }
): Promise<BackendMindmapLayout> {
  const res = await api.patch<Envelope<BackendMindmapLayout>>(
    `/mindmap-layouts/${id}`,
    params
  );
  return res.data;
}

export async function deleteBackendMindmapLayout(
  id: string
): Promise<DeleteMindmapLayoutResponse> {
  const res = await api.delete<Envelope<DeleteMindmapLayoutResponse>>(
    `/mindmap-layouts/${id}`
  );
  return res.data;
}

// ===================== ACCOUNT & SESSIONS =====================

export interface BackendAccount {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  email_verified: boolean;
  preferences?: BackendAccountPreferences;
  created_at?: string;
  updated_at?: string;
}

export interface BackendAccountPreferences {
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

export interface BackendSession {
  id: string;
  client?: string;
  ip?: string;
  user_agent?: string;
  current: boolean;
  created_at: string;
}

export interface GdprExportResponse {
  request_id: string;
  eta_hours: number;
}

export async function fetchBackendAccount(): Promise<BackendAccount> {
  const res = await api.get<Envelope<BackendAccount>>("/account");
  return res.data;
}

export async function updateBackendAccount(params: {
  name?: string;
  avatar_url?: string;
}): Promise<BackendAccount> {
  const res = await api.patch<Envelope<BackendAccount>>("/account", params);
  return res.data;
}

export async function fetchBackendAccountPreferences(): Promise<{
  preferences: BackendAccountPreferences;
  updated_at: string;
}> {
  const res = await api.get<
    Envelope<{ preferences: BackendAccountPreferences; updated_at: string }>
  >("/account/preferences");
  return res.data;
}

export async function updateBackendAccountPreferences(
  preferences: Partial<BackendAccountPreferences>,
  ifMatch?: string
): Promise<{ preferences: BackendAccountPreferences; updated_at: string }> {
  const headers: Record<string, string> = {};
  if (ifMatch) {
    headers["If-Match"] = ifMatch;
  }
  const res = await api.patch<
    Envelope<{ preferences: BackendAccountPreferences; updated_at: string }>
  >("/account/preferences", preferences, { headers });
  return res.data;
}

export async function changeBackendPassword(params: {
  current_password: string;
  new_password: string;
}): Promise<void> {
  await api.post("/auth/password/change", params);
}

export async function fetchBackendSessions(): Promise<BackendSession[]> {
  const res = await api.get<Envelope<BackendSession[]>>("/auth/sessions");
  return res.data;
}

export async function revokeBackendSession(sessionId: string): Promise<void> {
  await api.delete(`/auth/sessions/${sessionId}`);
}

export async function signoutAllBackendSessions(): Promise<void> {
  await api.post("/auth/signout-all");
}

export async function triggerBackendGdprExport(params?: {
  destination_email?: string;
  include_orgs?: string[];
}): Promise<GdprExportResponse> {
  const res = await api.post<Envelope<GdprExportResponse>>(
    "/me/gdpr-export",
    params || {}
  );
  return res.data;
}

// ===================== BACKGROUND JOBS & LINK HEALTH (Step 15) =====================

export interface BackendJob {
  job_id: string;
  kind: string;
  status: "queued" | "running" | "succeeded" | "partial" | "failed" | "canceled";
  phase: string | null;
  progress: {
    processed: number;
    total: number;
    percent: number;
  };
  eta_seconds: number | null;
  result_url: string | null;
  result_summary: Record<string, any> | null;
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
  organization_id: string;
  created_by_account_id: string | null;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
  expires_at: string;
}

export interface LinkHealthStats {
  total_items: number;
  healthy: number;
  broken: number;
  redirects: number;
  timeouts: number;
  last_checked_at: string | null;
}

export async function fetchBackendJob(jobId: string): Promise<BackendJob> {
  const res = await api.get<Envelope<BackendJob>>(`/jobs/${jobId}`);
  return res.data;
}

export async function listBackendJobs(filters?: {
  kind?: string;
  status?: string;
  limit?: number;
}): Promise<BackendJob[]> {
  const params: Record<string, string> = {};
  if (filters?.kind) params.kind = filters.kind;
  if (filters?.status) params.status = filters.status;
  if (filters?.limit) params.limit = String(filters.limit);

  const res = await api.get<Envelope<BackendJob[]>>("/jobs", { params });
  return res.data;
}

export async function cancelBackendJob(jobId: string): Promise<BackendJob> {
  const res = await api.post<Envelope<BackendJob>>(`/jobs/${jobId}/cancel`);
  return res.data;
}

export async function triggerBackendLinkHealth(params?: {
  space_id?: string;
  collection_id?: string;
  urls?: string[];
  mock_statuses?: Record<string, number>;
}): Promise<{
  job_id: string;
  status: string;
  phase?: string | null;
  progress: { processed: number; total: number; percent: number };
  result_summary?: Record<string, any> | null;
}> {
  const res = await api.post<
    Envelope<{
      job_id: string;
      status: string;
      phase?: string | null;
      progress: { processed: number; total: number; percent: number };
      result_summary?: Record<string, any> | null;
    }>
  >("/jobs/link-health", params || {});
  return res.data;
}

export async function fetchBackendLinkHealthStats(): Promise<LinkHealthStats> {
  const res = await api.get<Envelope<LinkHealthStats>>("/jobs/link-health/stats");
  return res.data;
}

export async function triggerBackendFaviconFetch(params?: {
  space_id?: string;
  collection_id?: string;
  force_refresh?: boolean;
}): Promise<{
  job_id: string;
  status: string;
  phase?: string | null;
  progress: { processed: number; total: number; percent: number };
  result_summary?: Record<string, any> | null;
}> {
  const res = await api.post<
    Envelope<{
      job_id: string;
      status: string;
      phase?: string | null;
      progress: { processed: number; total: number; percent: number };
      result_summary?: Record<string, any> | null;
    }>
  >("/jobs/favicon-fetch", params || {});
  return res.data;
}

// ===================== FEATURE FLAGS & LICENSES (Step 16) =====================

export interface BackendFlagEvaluation {
  variant: string;
  reason: string;
  payload?: Record<string, unknown> | null;
}

export interface BackendFlagsResponse {
  evaluated_at: string;
  ttl_seconds: number;
  flags: Record<string, BackendFlagEvaluation>;
  exposure_logged: boolean;
}

export interface OrgEntitlement {
  organization_id: string;
  plan: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  seats: number;
  seats_used: number;
  features: {
    max_organizations: number;
    max_spaces_per_org: number;
    max_collections_per_org: number;
    max_groups_per_collection: number;
    max_items_per_org: number;
    max_active_shares: number;
    max_tags_per_org: number;
    password_share: boolean;
    expiring_share: boolean;
    invite_only_share: boolean;
    custom_share_slug: boolean;
    share_analytics: boolean;
    remove_branding: boolean;
    bulk_import: boolean;
    bulk_export: boolean;
    history_retention_days: number;
    ai_tagging: boolean;
    priority_support: boolean;
  };
  lifetime_license: {
    code_masked: string;
    tier: string;
    stacked_seats: number;
    redeemed_at: string;
    redeemed_by_account_id: string;
  } | null;
}

export interface AccountEntitlementsResponse {
  account_id: string;
  entitlements_hash: string;
  by_organization: OrgEntitlement[];
}

export interface OrgBillingSummary {
  plan: string;
  status: string;
  billing_provider: string;
  customer_id: string;
  subscription_id: string | null;
  interval: "month" | "year";
  amount: { amount_cents: number; currency: string };
  seats: number;
  seats_used: number;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_ends_at: string | null;
  next_invoice_estimate: { amount_cents: number; currency: string };
  default_payment_method: {
    type: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  lifetime_license: {
    code_masked: string;
    tier: string;
    stacked_seats: number;
    redeemed_at: string;
    redeemed_by_account_id: string;
  } | null;
}

export async function fetchBackendFlags(): Promise<BackendFlagsResponse> {
  const res = await api.get<Envelope<BackendFlagsResponse>>("/flags");
  return res.data;
}

export async function evaluateBackendFlags(
  flags: string[],
  context?: Record<string, unknown>
): Promise<BackendFlagsResponse> {
  const res = await api.post<Envelope<BackendFlagsResponse>>("/flags/evaluate", {
    flags,
    context,
  });
  return res.data;
}

export async function fetchAccountEntitlements(): Promise<AccountEntitlementsResponse> {
  const res = await api.get<Envelope<AccountEntitlementsResponse>>("/me/entitlements");
  return res.data;
}

export async function fetchOrgBillingSummary(orgId: string): Promise<OrgBillingSummary> {
  const res = await api.get<Envelope<OrgBillingSummary>>(`/organizations/${orgId}/billing`);
  return res.data;
}

export async function createCheckoutSession(
  orgId: string,
  params: {
    plan?: string;
    interval?: string;
    seats?: number;
    success_url: string;
    cancel_url: string;
  }
): Promise<{ checkout_url: string; session_id: string; expires_at: string }> {
  const res = await api.post<
    Envelope<{ checkout_url: string; session_id: string; expires_at: string }>
  >(`/organizations/${orgId}/billing/checkout`, params);
  return res.data;
}

export async function openBillingPortal(
  orgId: string,
  returnUrl?: string
): Promise<{ portal_url: string }> {
  const res = await api.post<Envelope<{ portal_url: string }>>(
    `/organizations/${orgId}/billing/portal`,
    { return_url: returnUrl }
  );
  return res.data;
}

export async function changeOrgPlan(
  orgId: string,
  params: {
    plan: "free" | "pro" | "team" | "enterprise";
    interval?: "month" | "year";
    seats?: number;
    prorate?: boolean;
  }
): Promise<{
  applied: boolean;
  effective_at: string;
  proration_amount: { amount_cents: number; currency: string };
  subscription_id: string;
}> {
  const res = await api.post<
    Envelope<{
      applied: boolean;
      effective_at: string;
      proration_amount: { amount_cents: number; currency: string };
      subscription_id: string;
    }>
  >(`/organizations/${orgId}/billing/change`, params);
  return res.data;
}

export async function cancelOrgSubscription(
  orgId: string,
  params?: { at_period_end?: boolean; reason?: string; feedback?: string }
): Promise<OrgBillingSummary> {
  const res = await api.post<Envelope<OrgBillingSummary>>(
    `/organizations/${orgId}/billing/cancel`,
    params || {}
  );
  return res.data;
}

export async function redeemLifetimeLicense(
  orgId: string,
  code: string
): Promise<{
  lifetime_license: {
    code_masked: string;
    tier: string;
    stacked_seats: number;
    redeemed_at: string;
    redeemed_by_account_id: string;
  };
  plan: string;
  status: string;
}> {
  const res = await api.post<
    Envelope<{
      lifetime_license: {
        code_masked: string;
        tier: string;
        stacked_seats: number;
        redeemed_at: string;
        redeemed_by_account_id: string;
      };
      plan: string;
      status: string;
    }>
  >(`/organizations/${orgId}/billing/lifetime/redeem`, { code });
  return res.data;
}

export async function stackLifetimeLicense(
  orgId: string,
  code: string
): Promise<{
  lifetime_license: {
    code_masked: string;
    tier: string;
    stacked_seats: number;
    redeemed_at: string;
    redeemed_by_account_id: string;
  };
  plan: string;
  status: string;
}> {
  const res = await api.post<
    Envelope<{
      lifetime_license: {
        code_masked: string;
        tier: string;
        stacked_seats: number;
        redeemed_at: string;
        redeemed_by_account_id: string;
      };
      plan: string;
      status: string;
    }>
  >(`/organizations/${orgId}/billing/lifetime/stack`, { code });
  return res.data;
}

export async function fetchInvoicePdfMetadata(
  invoiceId: string
): Promise<{
  invoice_id: string;
  processor: string;
  pdf_url: string;
  pdf_url_expires_at: string;
  number: string;
  amount_total_cents: number;
  currency: string;
  issued_at: string;
}> {
  const res = await api.get<
    Envelope<{
      invoice_id: string;
      processor: string;
      pdf_url: string;
      pdf_url_expires_at: string;
      number: string;
      amount_total_cents: number;
      currency: string;
      issued_at: string;
    }>
  >(`/billing/invoices/${invoiceId}/pdf`, {
    headers: { Accept: "application/json" },
  });
  return res.data;
}

// ===================== NEXT QUEUE =====================
export interface BackendNextItem {
  id: string;
  accountId: string;
  nextCollectionId: string;
  itemId: string | null;
  sourceCollectionId: string | null;
  titleSnapshot: string;
  urlSnapshot: string;
  faviconUrlSnapshot: string | null;
  position: number;
  isDone: boolean;
  isTombstone: boolean;
  createdAt: string;
  updatedAt: string;
  isExisting?: boolean;
  reopened?: boolean;
  softCapWarning?: boolean;
}

export interface AddToNextPayload {
  item_id?: string | null;
  url: string;
  title?: string | null;
  favicon_url?: string | null;
  source_kind?: "collection" | "browser_tab" | "manual" | "session" | "bulk";
  source_collection_id?: string | null;
  position?: number;
  insert_position?: "top" | "bottom";
}

export interface UpdateNextItemPayload {
  is_done?: boolean;
  position?: number;
  title?: string;
}

export interface NextQueueResponse {
  items: BackendNextItem[];
  total_count: number;
  open_count: number;
}

export interface NextQueueRealtimeEvent {
  type: "next.item.added" | "next.item.updated" | "next.item.removed" | "next.item.tombstoned";
  channel: string;
  data: {
    item?: BackendNextItem;
    itemId?: string;
    accountId: string;
    timestamp: string;
  };
}

export async function fetchNextQueue(options?: { includeDone?: boolean }): Promise<NextQueueResponse> {
  const query = options?.includeDone === false ? "?include_done=false" : "";
  const res = await api.get<Envelope<NextQueueResponse>>(`/next${query}`);
  return res.data;
}

export async function addToNextQueue(payload: AddToNextPayload): Promise<{ data: BackendNextItem; message: string }> {
  const res = await api.post<{ data: BackendNextItem; message: string }>("/next", payload);
  return res;
}

export async function updateNextQueueItem(id: string, patch: UpdateNextItemPayload): Promise<BackendNextItem> {
  const res = await api.patch<Envelope<BackendNextItem>>(`/next/${id}`, patch);
  return res.data;
}

export async function removeNextQueueItem(id: string): Promise<{ ok: boolean; removed_id: string }> {
  const res = await api.delete<Envelope<{ ok: boolean; removed_id: string }>>(`/next/${id}`);
  return res.data;
}

export async function clearCompletedNextQueue(): Promise<{ deleted_count: number }> {
  const res = await api.post<Envelope<{ deleted_count: number }>>("/next/clear-completed", {});
  return res.data;
}

export function subscribeNextQueueSSE(
  onEvent: (event: NextQueueRealtimeEvent) => void,
  onError?: (err: any) => void
): () => void {
  const baseUrl = (api as any).baseUrl || "http://localhost:3000/v1";
  const token = (api as any).accessToken;
  const url = `${baseUrl}/next/events${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  let eventSource: EventSource | null = null;
  let isClosed = false;

  try {
    eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener("next", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        onEvent(parsed);
      } catch (err) {
        console.error("Failed to parse next queue event:", err);
      }
    });

    eventSource.onerror = (err) => {
      // Prevent infinite background reconnect loop that spins the browser tab
      if (eventSource && eventSource.readyState === EventSource.CLOSED) {
        eventSource.close();
      }
      if (!isClosed) {
        onError?.(err);
      }
    };
  } catch (err) {
    onError?.(err);
  }

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

