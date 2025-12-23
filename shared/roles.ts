export const Roles = {
  Admin: "admin",
  Manager: "manager",
  Agent: "agent",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const ALL_ROLES: Role[] = [Roles.Admin, Roles.Manager, Roles.Agent];
