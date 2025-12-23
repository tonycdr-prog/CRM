import type { RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import { Roles, type Role } from "@shared/roles";
import { db, isDatabaseAvailable } from "../db";

const ORG_ROLE_TO_APP_ROLE: Record<string, Role> = {
  owner: Roles.Admin,
  admin: Roles.Admin,
  office_staff: Roles.Manager,
  engineer: Roles.Agent,
  viewer: Roles.Agent,
};

export function mapOrganizationRole(role?: string | null): Role {
  if (!role) return Roles.Agent;
  return ORG_ROLE_TO_APP_ROLE[role] ?? Roles.Agent;
}

export function requireRole(allowed: Role[]): RequestHandler {
  return async (req, res, next) => {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const claimedRole =
      (req.user as any)?.claims?.organizationRole ??
      (req.user as any)?.organizationRole;
    if (!isDatabaseAvailable && claimedRole) {
      const role = mapOrganizationRole(String(claimedRole));
      if (!allowed.includes(role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return next();
    }

    const rows = await db
      .select({ organizationRole: users.organizationRole })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!rows.length) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const role = mapOrganizationRole(rows[0].organizationRole);
    if (!allowed.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
