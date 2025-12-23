import type { Toast } from "@/hooks/use-toast";

export function mapAuthErrorToToast(status?: number): Toast | null {
  if (status === 401 || status === 403) {
    return {
      title: "Auth/CSRF missing — refresh page",
      description: "Session expired or blocked. Refresh, then retry the action.",
      variant: "destructive",
    };
  }
  return null;
}
