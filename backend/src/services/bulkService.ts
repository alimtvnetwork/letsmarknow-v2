import { AppError } from "../errors/AppError.js";
import { itemService, type CreateItemInput, type UpdateItemInput } from "./itemService.js";
import { tagService } from "./tagService.js";

export interface BulkOperation {
  op: "create" | "update" | "move" | "delete" | "star" | "tag";
  id?: string;
  data?: Record<string, unknown>;
  if_match?: string;
}

export interface BulkItemResult {
  index: number;
  status: number;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

export class BulkService {
  public async executeBulkItems(
    orgId: string,
    accountId: string,
    input: {
      all_or_nothing?: boolean;
      operations: BulkOperation[];
    }
  ): Promise<{ results: BulkItemResult[]; hasFailure: boolean }> {
    const isAllOrNothing = input.all_or_nothing === true;
    const results: BulkItemResult[] = [];
    let hasFailure = false;
    let firstError: { status: number; code: string; message: string } | null = null;

    for (let i = 0; i < input.operations.length; i++) {
      const operation = input.operations[i];

      try {
        switch (operation.op) {
          case "create": {
            const raw = (operation.data || {}) as Record<string, any>;
            const created = await itemService.createItem(orgId, accountId, {
              collectionId: raw.collection_id || raw.collectionId,
              groupId: raw.group_id !== undefined ? raw.group_id : raw.groupId,
              url: raw.url,
              title: raw.title,
              description: raw.description,
              color: raw.color,
              source: raw.source || "bulk",
            });
            results.push({ index: i, status: 201, data: created });
            break;
          }

          case "update": {
            if (!operation.id) {
              throw new AppError({
                statusCode: 400,
                code: "VALIDATION_FAILED",
                message: "id is required for update operation",
              });
            }
            const raw = (operation.data || {}) as Record<string, any>;
            const updated = await itemService.updateItem(orgId, operation.id, {
              title: raw.title,
              url: raw.url,
              description: raw.description,
              color: raw.color,
              isStarred: raw.is_starred !== undefined ? raw.is_starred : raw.isStarred,
              position: raw.position,
            });
            results.push({ index: i, status: 200, data: updated });
            break;
          }

          case "move": {
            if (!operation.id) {
              throw new AppError({
                statusCode: 400,
                code: "VALIDATION_FAILED",
                message: "id is required for move operation",
              });
            }
            const raw = (operation.data || {}) as Record<string, any>;
            const moved = await itemService.moveItem(orgId, operation.id, {
              toCollectionId: raw.to_collection_id || raw.toCollectionId,
              toGroupId: raw.to_group_id !== undefined ? raw.to_group_id : raw.toGroupId,
            });
            results.push({ index: i, status: 200, data: moved });
            break;
          }

          case "delete": {
            if (!operation.id) {
              throw new AppError({
                statusCode: 400,
                code: "VALIDATION_FAILED",
                message: "id is required for delete operation",
              });
            }
            const res = await itemService.deleteItem(orgId, operation.id);
            results.push({ index: i, status: 200, data: res });
            break;
          }

          case "star": {
            if (!operation.id) {
              throw new AppError({
                statusCode: 400,
                code: "VALIDATION_FAILED",
                message: "id is required for star operation",
              });
            }
            const isStarred = (operation.data as { is_starred?: boolean })?.is_starred !== false;
            const starred = await itemService.updateItem(orgId, operation.id, { isStarred });
            results.push({ index: i, status: 200, data: starred });
            break;
          }

          case "tag": {
            if (!operation.id) {
              throw new AppError({
                statusCode: 400,
                code: "VALIDATION_FAILED",
                message: "id is required for tag operation",
              });
            }
            const tagData = operation.data as {
              add?: string[];
              remove?: string[];
              create?: Array<{ name: string; color?: string }>;
            };
            const tagIds = await tagService.setItemTags(orgId, accountId, operation.id, tagData);
            results.push({ index: i, status: 200, data: { item_id: operation.id, tag_ids: tagIds } });
            break;
          }

          default:
            throw new AppError({
              statusCode: 400,
              code: "UNSUPPORTED_OPERATION",
              message: `Operation '${(operation as { op: string }).op}' is not supported.`,
            });
        }
      } catch (err: unknown) {
        hasFailure = true;
        const statusCode = err instanceof AppError ? err.statusCode : 500;
        const code = err instanceof AppError ? err.code : "INTERNAL_ERROR";
        const message = err instanceof Error ? err.message : "Operation failed";

        if (!firstError) {
          firstError = { status: statusCode, code, message };
        }

        results.push({
          index: i,
          status: statusCode,
          error: { code, message },
        });

        if (isAllOrNothing) {
          throw new AppError({
            statusCode: firstError.status,
            code: firstError.code,
            message: `Bulk operation failed at index ${i}: ${firstError.message}`,
            details: { failed_index: i, all_results: results },
          });
        }
      }
    }

    return { results, hasFailure };
  }
}

export const bulkService = new BulkService();
