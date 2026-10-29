import { AppError } from "../errors/AppError.js";
import { uuidv7 } from "../db/utils/uuidv7.js";
import {
  memRepo,
  type MemMindmapLayout,
  type MemMindmapNode,
  type MemMindmapEdge,
  type MemMindmapViewport,
} from "../db/memRepo.js";

export interface MindmapLayoutSummary {
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

export interface MindmapLayoutDetail {
  id: string;
  name: string;
  scope_type: "space" | "collection" | "group";
  scope_id: string;
  is_default: boolean;
  viewport: MemMindmapViewport;
  nodes: MemMindmapNode[];
  edges: MemMindmapEdge[];
  created_by_account_id: string;
  shared_with_org: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMindmapLayoutInput {
  name: string;
  scope_type: "space" | "collection" | "group";
  scope_id: string;
  is_default?: boolean;
  shared_with_org?: boolean;
  viewport?: MemMindmapViewport;
  nodes?: MemMindmapNode[];
  edges?: MemMindmapEdge[];
}

export interface UpdateMindmapLayoutInput {
  name?: string;
  is_default?: boolean;
  shared_with_org?: boolean;
  viewport?: MemMindmapViewport;
  nodes?: MemMindmapNode[];
  edges?: MemMindmapEdge[];
}

export interface DeleteMindmapLayoutResult {
  id: string;
  deleted_at: string;
  was_default: boolean;
  new_default_id: string | null;
  already_deleted?: boolean;
}

export class MindmapService {
  /**
   * List layouts for a scope
   * Spec: GET /v1/mindmap-layouts?scope_type=collection&scope_id=...
   */
  async listLayouts(
    orgId: string,
    accountId: string,
    query: {
      scope_type: string;
      scope_id: string;
      include_shared?: boolean;
    }
  ): Promise<{ data: MindmapLayoutSummary[]; page: { next_cursor: null; has_more: false } }> {
    if (!["space", "collection", "group"].includes(query.scope_type)) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Invalid scope_type: must be space, collection, or group",
        field: "scope_type",
      });
    }

    if (!query.scope_id) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "scope_id is required",
        field: "scope_id",
      });
    }

    const includeShared = query.include_shared !== false;

    const matched = memRepo.mindmapLayouts.filter((l) => {
      if (l.organizationId !== orgId || l.deletedAt) return false;
      if (l.scopeType !== query.scope_type || l.scopeId !== query.scope_id) return false;

      const isOwner = l.accountId === accountId;
      const isShared = l.sharedWithOrg && includeShared;
      return isOwner || isShared;
    });

    // Sort by is_default desc, then updated_at desc
    matched.sort((a, b) => {
      if (a.isDefault !== b.isDefault) {
        return a.isDefault ? -1 : 1;
      }
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    const summaries: MindmapLayoutSummary[] = matched.map((l) => ({
      id: l.id,
      name: l.name,
      scope_type: l.scopeType,
      scope_id: l.scopeId,
      is_default: l.isDefault,
      node_count: l.nodes.length,
      created_by_account_id: l.accountId,
      shared_with_org: l.sharedWithOrg,
      created_at: l.createdAt.toISOString(),
      updated_at: l.updatedAt.toISOString(),
    }));

    return {
      data: summaries,
      page: { next_cursor: null, has_more: false },
    };
  }

  /**
   * Get a single layout with full payload (nodes, edges, viewport)
   * Spec: GET /v1/mindmap-layouts/:id
   */
  async getLayout(
    orgId: string,
    accountId: string,
    userRole: string,
    id: string
  ): Promise<MindmapLayoutDetail> {
    const layout = memRepo.mindmapLayouts.find(
      (l) => l.id === id && l.organizationId === orgId && !l.deletedAt
    );

    if (!layout) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Mindmap layout not found",
      });
    }

    const isCreator = layout.accountId === accountId;
    const isOrgAdmin = userRole === "owner" || userRole === "admin";
    if (!layout.sharedWithOrg && !isCreator && !isOrgAdmin) {
      throw new AppError({
        statusCode: 403,
        code: "PERM_DENIED",
        message: "You do not have permission to view this layout",
      });
    }

    return {
      id: layout.id,
      name: layout.name,
      scope_type: layout.scopeType,
      scope_id: layout.scopeId,
      is_default: layout.isDefault,
      viewport: layout.viewport,
      nodes: layout.nodes,
      edges: layout.edges,
      created_by_account_id: layout.accountId,
      shared_with_org: layout.sharedWithOrg,
      created_at: layout.createdAt.toISOString(),
      updated_at: layout.updatedAt.toISOString(),
    };
  }

  /**
   * Create a layout
   * Spec: POST /v1/mindmap-layouts
   */
  async createLayout(
    orgId: string,
    accountId: string,
    data: CreateMindmapLayoutInput
  ): Promise<MindmapLayoutDetail> {
    const name = data.name?.trim();
    if (!name || name.length < 1 || name.length > 80) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "name is required and must be between 1 and 80 characters",
        field: "name",
      });
    }

    if (!["space", "collection", "group"].includes(data.scope_type)) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Invalid scope_type: must be space, collection, or group",
        field: "scope_type",
      });
    }

    if (!data.scope_id) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "scope_id is required",
        field: "scope_id",
      });
    }

    if (data.nodes && data.nodes.length > 5000) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Node count cannot exceed 5000",
        field: "nodes",
      });
    }

    // Name uniqueness check per (scope_type, scope_id, created_by_account_id)
    const duplicate = memRepo.mindmapLayouts.find(
      (l) =>
        l.organizationId === orgId &&
        l.accountId === accountId &&
        l.scopeType === data.scope_type &&
        l.scopeId === data.scope_id &&
        l.name.toLowerCase() === name.toLowerCase() &&
        !l.deletedAt
    );

    if (duplicate) {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT_NAME_TAKEN",
        message: "A layout with this name already exists for this scope",
        field: "name",
      });
    }

    const isDefault = Boolean(data.is_default);

    // If new layout is default, unset previous default for this scope
    if (isDefault) {
      for (const l of memRepo.mindmapLayouts) {
        if (
          l.organizationId === orgId &&
          l.accountId === accountId &&
          l.scopeType === data.scope_type &&
          l.scopeId === data.scope_id &&
          !l.deletedAt &&
          l.isDefault
        ) {
          l.isDefault = false;
          l.updatedAt = new Date();
        }
      }
    }

    const layout: MemMindmapLayout = {
      id: uuidv7(),
      organizationId: orgId,
      accountId,
      scopeType: data.scope_type,
      scopeId: data.scope_id,
      name,
      isDefault,
      sharedWithOrg: Boolean(data.shared_with_org),
      viewport: data.viewport ?? { x: 0, y: 0, zoom: 1.0 },
      nodes: data.nodes ?? [],
      edges: data.edges ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memRepo.mindmapLayouts.push(layout);

    return {
      id: layout.id,
      name: layout.name,
      scope_type: layout.scopeType,
      scope_id: layout.scopeId,
      is_default: layout.isDefault,
      viewport: layout.viewport,
      nodes: layout.nodes,
      edges: layout.edges,
      created_by_account_id: layout.accountId,
      shared_with_org: layout.sharedWithOrg,
      created_at: layout.createdAt.toISOString(),
      updated_at: layout.updatedAt.toISOString(),
    };
  }

  /**
   * Update a layout (rename, reposition, change default, share)
   * Spec: PATCH /v1/mindmap-layouts/:id
   */
  async updateLayout(
    orgId: string,
    accountId: string,
    userRole: string,
    id: string,
    data: UpdateMindmapLayoutInput
  ): Promise<MindmapLayoutDetail> {
    const layout = memRepo.mindmapLayouts.find(
      (l) => l.id === id && l.organizationId === orgId && !l.deletedAt
    );

    if (!layout) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Mindmap layout not found",
      });
    }

    const isCreator = layout.accountId === accountId;
    const isOrgAdmin = userRole === "owner" || userRole === "admin";
    if (!isCreator && !isOrgAdmin) {
      throw new AppError({
        statusCode: 403,
        code: "PERM_DENIED",
        message: "You do not have permission to update this layout",
      });
    }

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name || name.length < 1 || name.length > 80) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "name must be between 1 and 80 characters",
          field: "name",
        });
      }

      const duplicate = memRepo.mindmapLayouts.find(
        (l) =>
          l.id !== id &&
          l.organizationId === orgId &&
          l.accountId === layout.accountId &&
          l.scopeType === layout.scopeType &&
          l.scopeId === layout.scopeId &&
          l.name.toLowerCase() === name.toLowerCase() &&
          !l.deletedAt
      );

      if (duplicate) {
        throw new AppError({
          statusCode: 409,
          code: "CONFLICT_NAME_TAKEN",
          message: "A layout with this name already exists for this scope",
          field: "name",
        });
      }

      layout.name = name;
    }

    if (data.nodes !== undefined) {
      if (data.nodes.length > 5000) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Node count cannot exceed 5000",
          field: "nodes",
        });
      }
      layout.nodes = data.nodes;
    }

    if (data.edges !== undefined) {
      layout.edges = data.edges;
    }

    if (data.viewport !== undefined) {
      layout.viewport = data.viewport;
    }

    if (data.shared_with_org !== undefined) {
      layout.sharedWithOrg = Boolean(data.shared_with_org);
    }

    if (data.is_default !== undefined) {
      const isDefault = Boolean(data.is_default);
      if (isDefault) {
        for (const l of memRepo.mindmapLayouts) {
          if (
            l.id !== id &&
            l.organizationId === orgId &&
            l.accountId === layout.accountId &&
            l.scopeType === layout.scopeType &&
            l.scopeId === layout.scopeId &&
            !l.deletedAt &&
            l.isDefault
          ) {
            l.isDefault = false;
            l.updatedAt = new Date();
          }
        }
      }
      layout.isDefault = isDefault;
    }

    layout.updatedAt = new Date();

    return {
      id: layout.id,
      name: layout.name,
      scope_type: layout.scopeType,
      scope_id: layout.scopeId,
      is_default: layout.isDefault,
      viewport: layout.viewport,
      nodes: layout.nodes,
      edges: layout.edges,
      created_by_account_id: layout.accountId,
      shared_with_org: layout.sharedWithOrg,
      created_at: layout.createdAt.toISOString(),
      updated_at: layout.updatedAt.toISOString(),
    };
  }

  /**
   * Delete a layout
   * Spec: DELETE /v1/mindmap-layouts/:id
   * - Caller must be creator OR Org owner/admin.
   * - If deleted was is_default, promote most recently updated remaining layout for the same scope.
   */
  async deleteLayout(
    orgId: string,
    accountId: string,
    userRole: string,
    id: string
  ): Promise<DeleteMindmapLayoutResult> {
    const layout = memRepo.mindmapLayouts.find(
      (l) => l.id === id && l.organizationId === orgId
    );

    if (!layout) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Mindmap layout not found",
      });
    }

    // Idempotent re-deletion
    if (layout.deletedAt) {
      return {
        id: layout.id,
        deleted_at: layout.deletedAt.toISOString(),
        was_default: false,
        new_default_id: null,
        already_deleted: true,
      };
    }

    const isCreator = layout.accountId === accountId;
    const isOrgAdmin = userRole === "owner" || userRole === "admin";
    if (!isCreator && !isOrgAdmin) {
      throw new AppError({
        statusCode: 403,
        code: "PERM_DENIED",
        message: "You do not have permission to delete this layout",
      });
    }

    const wasDefault = layout.isDefault;
    layout.deletedAt = new Date();
    layout.isDefault = false;

    let newDefaultId: string | null = null;

    if (wasDefault) {
      // Find remaining active layouts for this scope
      const siblings = memRepo.mindmapLayouts.filter(
        (l) =>
          l.id !== id &&
          l.organizationId === orgId &&
          l.accountId === layout.accountId &&
          l.scopeType === layout.scopeType &&
          l.scopeId === layout.scopeId &&
          !l.deletedAt
      );

      if (siblings.length > 0) {
        // Promote most recently updated remaining layout
        siblings.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        const promoted = siblings[0];
        promoted.isDefault = true;
        promoted.updatedAt = new Date();
        newDefaultId = promoted.id;
      }
    }

    return {
      id: layout.id,
      deleted_at: layout.deletedAt.toISOString(),
      was_default: wasDefault,
      new_default_id: newDefaultId,
    };
  }
}

export const mindmapService = new MindmapService();
