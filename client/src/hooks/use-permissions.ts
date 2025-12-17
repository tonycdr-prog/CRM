import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { UserRole } from "@shared/schema";

type Permission = 
  | "view_dashboard"
  | "view_clients"
  | "manage_clients"
  | "view_jobs"
  | "manage_jobs"
  | "view_finance"
  | "manage_finance"
  | "view_contracts"
  | "manage_contracts"
  | "view_equipment"
  | "manage_equipment"
  | "view_staff"
  | "manage_staff"
  | "view_reports"
  | "manage_settings"
  | "access_field_companion"
  | "complete_jobs"
  | "perform_testing";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "view_dashboard",
    "view_clients",
    "manage_clients",
    "view_jobs",
    "manage_jobs",
    "view_finance",
    "manage_finance",
    "view_contracts",
    "manage_contracts",
    "view_equipment",
    "manage_equipment",
    "view_staff",
    "manage_staff",
    "view_reports",
    "manage_settings",
    "access_field_companion",
    "complete_jobs",
    "perform_testing",
  ],
  office_manager: [
    "view_dashboard",
    "view_clients",
    "manage_clients",
    "view_jobs",
    "manage_jobs",
    "view_finance",
    "manage_finance",
    "view_contracts",
    "manage_contracts",
    "view_equipment",
    "view_staff",
    "view_reports",
    "access_field_companion",
  ],
  field_engineer: [
    "view_dashboard",
    "view_jobs",
    "access_field_companion",
    "complete_jobs",
    "perform_testing",
  ],
};

export function usePermissions() {
  const { user } = useAuth();
  const role = (user?.role as UserRole) || "field_engineer";

  const permissions = useMemo(() => {
    const rolePermissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.field_engineer;
    
    return {
      role,
      roleLabel: role === "admin" ? "Admin" : 
                 role === "office_manager" ? "Office Manager" : 
                 "Field Engineer",
      permissions: rolePermissions,
      hasPermission: (permission: Permission) => rolePermissions.includes(permission),
      isAdmin: role === "admin",
      isOfficeManager: role === "office_manager",
      isFieldEngineer: role === "field_engineer",
      canManage: role === "admin" || role === "office_manager",
      canAccessOffice: role === "admin" || role === "office_manager",
      canAccessField: true,
    };
  }, [role]);

  return permissions;
}
