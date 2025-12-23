import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { User } from "@shared/schema";

// TEST MODE: Bypass authentication for external testers
// Set to false to re-enable normal authentication
const TEST_MODE_ENABLED = false;

const TEST_USER: User = {
  id: "test-user-shared",
  email: "test-shared@example.com",
  firstName: "Test",
  lastName: "User",
  profileImageUrl: null,
  username: null,
  password: null,
  displayName: "Test User",
  companyName: null,
  role: "admin", // Test user has admin role for full access
  organizationId: null,
  organizationRole: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function useAuth(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? !TEST_MODE_ENABLED;
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled,
  });

  const logout = useCallback(() => {
    if (TEST_MODE_ENABLED) {
      window.location.reload();
      return;
    }
    window.location.href = "/api/logout";
  }, []);

  // In test mode, always return the test user
  if (TEST_MODE_ENABLED) {
    return {
      user: TEST_USER,
      isLoading: false,
      isAuthenticated: true,
      logout,
    };
  }

  return {
    user,
    isLoading: enabled ? isLoading : false,
    isAuthenticated: !!user,
    logout,
  };
}
