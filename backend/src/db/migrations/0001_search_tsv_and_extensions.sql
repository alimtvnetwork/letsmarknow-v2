-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Full-Text Search tsvector generated columns per 02-spec/21-app/14-search/06-search-engine.md
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "search_tsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("description", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("url", '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS "items_search_tsv_idx" ON "items" USING gin ("search_tsv");
CREATE INDEX IF NOT EXISTS "items_title_trgm_idx" ON "items" USING gin ("title" gin_trgm_ops);

ALTER TABLE "spaces" ADD COLUMN IF NOT EXISTS "search_tsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("name", '')), 'A')
  ) STORED;

ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "search_tsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("description", '')), 'B')
  ) STORED;

ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "search_tsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("name", '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS "spaces_search_tsv_idx" ON "spaces" USING gin ("search_tsv");
CREATE INDEX IF NOT EXISTS "collections_search_tsv_idx" ON "collections" USING gin ("search_tsv");
CREATE INDEX IF NOT EXISTS "groups_search_tsv_idx" ON "groups" USING gin ("search_tsv");
