import "fastify";

export type OrgRole =
  | "owner"
  | "admin"
  | "editor"
  | "viewer"
  | "billing"
  | "guest"
  | "system";

declare module "fastify" {
  interface FastifyRequest {
    organizationId?: string;
    idempotencyKey?: string;
    account?: {
      id: string;
      email: string;
      role?: string;
    };
    orgMember?: {
      id: string;
      organizationId: string;
      role: OrgRole;
    };
  }
}
