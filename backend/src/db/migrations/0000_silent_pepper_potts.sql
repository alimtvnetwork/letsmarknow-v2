CREATE TYPE "public"."collection_kind" AS ENUM('manual', 'session', 'next');--> statement-breakpoint
CREATE TYPE "public"."org_role" AS ENUM('owner', 'admin', 'editor', 'viewer', 'billing', 'guest', 'system');--> statement-breakpoint
CREATE TYPE "public"."share_mode" AS ENUM('public', 'password', 'invite_only');--> statement-breakpoint
CREATE TYPE "public"."share_permission" AS ENUM('view', 'organize');--> statement-breakpoint
CREATE TYPE "public"."share_target_type" AS ENUM('workspace', 'space', 'collection', 'group', 'item');--> statement-breakpoint
CREATE TYPE "public"."view_mode" AS ENUM('list', 'grid', 'compact', 'mindmap', 'column');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"display_name" varchar(120),
	"avatar_url" text,
	"email_verified_at" timestamp with time zone,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth_identities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"provider" varchar(32) NOT NULL,
	"provider_user_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfa_factors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"factor_type" varchar(32) DEFAULT 'totp' NOT NULL,
	"secret" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"refresh_token_hash" varchar(255) NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_refresh_token_hash_unique" UNIQUE("refresh_token_hash")
);
--> statement-breakpoint
CREATE TABLE "org_invites" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "org_role" DEFAULT 'viewer' NOT NULL,
	"token" varchar(255) NOT NULL,
	"invited_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "org_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"account_id" uuid,
	"role" "org_role" DEFAULT 'viewer' NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"invited_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(63) NOT NULL,
	"logo_url" text,
	"brand_color" varchar(7),
	"plan" varchar(32) DEFAULT 'free' NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"default_space_id" uuid,
	"subscription_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "spaces" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(63) NOT NULL,
	"description" text,
	"icon" varchar(64),
	"color" varchar(32),
	"position" double precision DEFAULT 0 NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"space_id" uuid,
	"account_id" uuid,
	"name" varchar(120) NOT NULL,
	"slug" varchar(63),
	"description" text,
	"kind" "collection_kind" DEFAULT 'manual' NOT NULL,
	"color" varchar(32) DEFAULT 'none' NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"position" double precision DEFAULT 0 NOT NULL,
	"view_mode" "view_mode" DEFAULT 'grid' NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"space_id" uuid,
	"collection_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"position" double precision DEFAULT 0 NOT NULL,
	"color" varchar(32) DEFAULT 'none' NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"space_id" uuid,
	"collection_id" uuid NOT NULL,
	"group_id" uuid,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"favicon_url" text,
	"color" varchar(32) DEFAULT 'none' NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"position" double precision DEFAULT 0 NOT NULL,
	"source" varchar(32) DEFAULT 'manual' NOT NULL,
	"last_visited_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "item_tags" (
	"item_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "item_tags_item_id_tag_id_pk" PRIMARY KEY("item_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"color" varchar(32) DEFAULT 'none' NOT NULL,
	"usage_count_cache" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shares" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"target_type" "share_target_type" DEFAULT 'collection' NOT NULL,
	"target_id" uuid NOT NULL,
	"mode" "share_mode" DEFAULT 'public' NOT NULL,
	"password_hash" varchar(255),
	"slug" varchar(63) NOT NULL,
	"memorable_slug" varchar(63),
	"permission" "share_permission" DEFAULT 'view' NOT NULL,
	"allow_clone_to_my_account" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shares_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "next_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"next_collection_id" uuid NOT NULL,
	"item_id" uuid,
	"source_collection_id" uuid,
	"title_snapshot" text NOT NULL,
	"url_snapshot" text NOT NULL,
	"favicon_url_snapshot" text,
	"position" double precision DEFAULT 0 NOT NULL,
	"is_done" boolean DEFAULT false NOT NULL,
	"is_tombstone" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "history_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"account_id" uuid,
	"entity_type" varchar(32) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(64) NOT NULL,
	"forward_patch" jsonb,
	"reverse_patch" jsonb,
	"undone_by_event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "licenses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid,
	"account_id" uuid,
	"key" varchar(64),
	"plan" varchar(32) DEFAULT 'pro' NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "licenses_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" varchar(32) NOT NULL,
	"provider_subscription_id" varchar(255) NOT NULL,
	"status" varchar(32) NOT NULL,
	"plan" varchar(32) NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_provider_subscription_id_unique" UNIQUE("provider_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid,
	"key" varchar(255) NOT NULL,
	"status_code" integer NOT NULL,
	"response_headers" jsonb,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "idempotency_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_factors" ADD CONSTRAINT "mfa_factors_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_invites" ADD CONSTRAINT "org_invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_invites" ADD CONSTRAINT "org_invites_invited_by_accounts_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_invited_by_accounts_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_account_id_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_created_by_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_updated_by_accounts_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_created_by_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_updated_by_accounts_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_updated_by_accounts_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_created_by_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_updated_by_accounts_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_created_by_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_items" ADD CONSTRAINT "next_items_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_items" ADD CONSTRAINT "next_items_next_collection_id_collections_id_fk" FOREIGN KEY ("next_collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_items" ADD CONSTRAINT "next_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_items" ADD CONSTRAINT "next_items_source_collection_id_collections_id_fk" FOREIGN KEY ("source_collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history_events" ADD CONSTRAINT "history_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history_events" ADD CONSTRAINT "history_events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history_events" ADD CONSTRAINT "history_events_undone_by_event_id_history_events_id_fk" FOREIGN KEY ("undone_by_event_id") REFERENCES "public"."history_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_email_idx" ON "accounts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "accounts_deleted_at_idx" ON "accounts" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "auth_identities_account_id_idx" ON "auth_identities" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "auth_identities_provider_idx" ON "auth_identities" USING btree ("provider","provider_user_id");--> statement-breakpoint
CREATE INDEX "mfa_factors_account_id_idx" ON "mfa_factors" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "sessions_account_id_idx" ON "sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "org_invites_org_email_idx" ON "org_invites" USING btree ("organization_id","email");--> statement-breakpoint
CREATE INDEX "org_invites_token_idx" ON "org_invites" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "org_members_org_account_uidx" ON "org_members" USING btree ("organization_id","account_id");--> statement-breakpoint
CREATE INDEX "org_members_account_id_idx" ON "org_members" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "org_members_org_role_idx" ON "org_members" USING btree ("organization_id","role");--> statement-breakpoint
CREATE INDEX "orgs_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "orgs_owner_id_idx" ON "organizations" USING btree ("owner_account_id");--> statement-breakpoint
CREATE INDEX "orgs_deleted_at_idx" ON "organizations" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "spaces_org_id_idx" ON "spaces" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "spaces_org_slug_idx" ON "spaces" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "spaces_position_idx" ON "spaces" USING btree ("organization_id","position");--> statement-breakpoint
CREATE INDEX "spaces_deleted_at_idx" ON "spaces" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "collections_org_id_idx" ON "collections" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "collections_space_id_idx" ON "collections" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "collections_account_kind_idx" ON "collections" USING btree ("account_id","kind");--> statement-breakpoint
CREATE INDEX "collections_starred_idx" ON "collections" USING btree ("organization_id","is_starred");--> statement-breakpoint
CREATE INDEX "collections_position_idx" ON "collections" USING btree ("space_id","position");--> statement-breakpoint
CREATE INDEX "collections_deleted_at_idx" ON "collections" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "groups_org_id_idx" ON "groups" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "groups_collection_id_idx" ON "groups" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "groups_position_idx" ON "groups" USING btree ("collection_id","position");--> statement-breakpoint
CREATE INDEX "groups_deleted_at_idx" ON "groups" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "items_org_id_idx" ON "items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "items_collection_id_idx" ON "items" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "items_group_id_idx" ON "items" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "items_starred_idx" ON "items" USING btree ("organization_id","is_starred");--> statement-breakpoint
CREATE INDEX "items_url_idx" ON "items" USING btree ("organization_id","url");--> statement-breakpoint
CREATE INDEX "items_position_idx" ON "items" USING btree ("collection_id","position");--> statement-breakpoint
CREATE INDEX "items_deleted_at_idx" ON "items" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "item_tags_tag_id_idx" ON "item_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_org_name_uidx" ON "tags" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "tags_org_id_idx" ON "tags" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "shares_org_id_idx" ON "shares" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "shares_slug_idx" ON "shares" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "shares_memorable_slug_uidx" ON "shares" USING btree ("memorable_slug");--> statement-breakpoint
CREATE INDEX "shares_target_idx" ON "shares" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "shares_active_idx" ON "shares" USING btree ("revoked_at","expires_at");--> statement-breakpoint
CREATE INDEX "next_items_account_idx" ON "next_items" USING btree ("account_id","is_done");--> statement-breakpoint
CREATE INDEX "next_items_position_idx" ON "next_items" USING btree ("account_id","position");--> statement-breakpoint
CREATE INDEX "next_items_item_id_idx" ON "next_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "history_org_created_idx" ON "history_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "history_entity_idx" ON "history_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "history_account_id_idx" ON "history_events" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "licenses_org_id_idx" ON "licenses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "licenses_account_id_idx" ON "licenses" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "licenses_key_idx" ON "licenses" USING btree ("key");--> statement-breakpoint
CREATE INDEX "subscriptions_org_id_idx" ON "subscriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "subscriptions_provider_id_idx" ON "subscriptions" USING btree ("provider","provider_subscription_id");--> statement-breakpoint
CREATE INDEX "idempotency_key_idx" ON "idempotency_keys" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idempotency_expires_at_idx" ON "idempotency_keys" USING btree ("expires_at");