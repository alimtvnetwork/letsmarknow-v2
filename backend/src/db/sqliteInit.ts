import type { Client as LibsqlClient } from "@libsql/client";

export const SQLITE_INIT_DDL = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  display_name TEXT,
  avatar_url TEXT,
  email_verified_at INTEGER,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS auth_identities (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  last_active_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE TABLE IF NOT EXISTS mfa_factors (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  factor_type TEXT NOT NULL,
  secret_encrypted TEXT NOT NULL,
  verified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  brand_color TEXT,
  plan TEXT DEFAULT 'free' NOT NULL,
  owner_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  default_space_id TEXT,
  subscription_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS org_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'viewer' NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  invited_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(organization_id, account_id)
);

CREATE TABLE IF NOT EXISTS org_invites (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  position REAL DEFAULT 0 NOT NULL,
  is_private INTEGER DEFAULT 0 NOT NULL,
  created_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  space_id TEXT REFERENCES spaces(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  kind TEXT DEFAULT 'manual' NOT NULL,
  color TEXT DEFAULT 'none' NOT NULL,
  is_starred INTEGER DEFAULT 0 NOT NULL,
  position REAL DEFAULT 0 NOT NULL,
  view_mode TEXT DEFAULT 'grid' NOT NULL,
  created_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  space_id TEXT REFERENCES spaces(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position REAL DEFAULT 0 NOT NULL,
  color TEXT DEFAULT 'none' NOT NULL,
  created_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS group_items (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  position REAL DEFAULT 0 NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  space_id TEXT REFERENCES spaces(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  favicon_url TEXT,
  color TEXT DEFAULT 'none' NOT NULL,
  is_starred INTEGER DEFAULT 0 NOT NULL,
  position REAL DEFAULT 0 NOT NULL,
  source TEXT DEFAULT 'manual' NOT NULL,
  last_visited_at INTEGER,
  created_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'none' NOT NULL,
  usage_count_cache INTEGER DEFAULT 0 NOT NULL,
  created_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS item_tags (
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_type TEXT DEFAULT 'collection' NOT NULL,
  target_id TEXT NOT NULL,
  mode TEXT DEFAULT 'public' NOT NULL,
  password_hash TEXT,
  slug TEXT NOT NULL UNIQUE,
  memorable_slug TEXT UNIQUE,
  permission TEXT DEFAULT 'view' NOT NULL,
  allow_clone_to_my_account INTEGER DEFAULT 1 NOT NULL,
  show_branding INTEGER DEFAULT 1 NOT NULL,
  analytics_enabled INTEGER DEFAULT 1 NOT NULL,
  default_view_mode TEXT DEFAULT 'grid' NOT NULL,
  title_override TEXT,
  description_override TEXT,
  allowed_emails TEXT DEFAULT '[]' NOT NULL,
  expires_at INTEGER,
  revoked_at INTEGER,
  view_count INTEGER DEFAULT 0 NOT NULL,
  unique_viewer_count INTEGER DEFAULT 0 NOT NULL,
  click_count INTEGER DEFAULT 0 NOT NULL,
  last_viewed_at INTEGER,
  created_by TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS next_items (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  next_collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES items(id) ON DELETE SET NULL,
  source_collection_id TEXT REFERENCES collections(id) ON DELETE SET NULL,
  title_snapshot TEXT NOT NULL,
  url_snapshot TEXT NOT NULL,
  favicon_url_snapshot TEXT,
  position REAL DEFAULT 0 NOT NULL,
  is_done INTEGER DEFAULT 0 NOT NULL,
  is_tombstone INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS mindmap_layouts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_default INTEGER DEFAULT 0 NOT NULL,
  shared_with_org INTEGER DEFAULT 0 NOT NULL,
  viewport TEXT NOT NULL,
  nodes TEXT NOT NULL,
  edges TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS history_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  forward_patch TEXT,
  reverse_patch TEXT,
  batch_id TEXT,
  client TEXT,
  is_undoable INTEGER DEFAULT 1 NOT NULL,
  undone_at INTEGER,
  undone_by_event_id TEXT,
  redone_at INTEGER,
  undo_expires_at INTEGER,
  metadata TEXT DEFAULT '{}' NOT NULL,
  entity_snapshot TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE RESTRICT,
  account_id TEXT REFERENCES accounts(id) ON DELETE RESTRICT,
  key TEXT UNIQUE,
  plan TEXT DEFAULT 'pro' NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_subscription_id TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active' NOT NULL,
  plan TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  current_period_end INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  key TEXT NOT NULL UNIQUE,
  status_code INTEGER NOT NULL,
  response_headers TEXT,
  response_body TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  status TEXT DEFAULT 'queued' NOT NULL,
  phase TEXT,
  progress TEXT,
  eta_seconds INTEGER,
  result_url TEXT,
  result_summary TEXT,
  error TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  finished_at INTEGER,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT DEFAULT 'boolean' NOT NULL,
  default_value TEXT DEFAULT 'off' NOT NULL,
  rollout_pct INTEGER DEFAULT 100,
  variants TEXT,
  targeting TEXT,
  is_killswitch INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureSqliteTables(client: LibsqlClient): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await client.execute("PRAGMA journal_mode = WAL;");
      await client.execute("PRAGMA busy_timeout = 5000;");

      const statements = SQLITE_INIT_DDL.split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await client.batch(
        statements.map((sql) => ({ sql, args: [] })),
        "write"
      );

      initialized = true;
    } catch (err) {
      // In concurrent test runners, another worker may have initialized tables
      initialized = true;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}
