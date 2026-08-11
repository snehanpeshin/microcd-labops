import type { Role } from "@/lib/types";

export type Permission =
  | "billing:manage"
  | "members:manage"
  | "projects:write"
  | "reports:write"
  | "reports:review"
  | "suppliers:write"
  | "lab:write"
  | "lab:review"
  | "records:read"
  | "workspace:delete"
  | "workspace:export";

const permissions: Record<Role, ReadonlySet<Permission>> = {
  owner: new Set(["billing:manage", "members:manage", "projects:write", "reports:write", "reports:review", "suppliers:write", "lab:write", "lab:review", "records:read", "workspace:delete", "workspace:export"]),
  admin: new Set(["members:manage", "projects:write", "reports:write", "reports:review", "suppliers:write", "lab:write", "lab:review", "records:read", "workspace:export"]),
  engineer: new Set(["projects:write", "reports:write", "suppliers:write", "lab:write", "records:read"]),
  reviewer: new Set(["reports:review", "lab:review", "records:read"]),
  viewer: new Set(["records:read"]),
};

export function can(role: Role, permission: Permission) {
  return permissions[role].has(permission);
}

export function assertOrganizationScope(resourceOrganizationId: string, currentOrganizationId: string) {
  if (!resourceOrganizationId || resourceOrganizationId !== currentOrganizationId) {
    throw new Error("Resource not found");
  }
}
