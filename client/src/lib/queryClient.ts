import { QueryClient, QueryFunction } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

type ApiResponseData = unknown;

export class ApiError extends Error {
  status: number;
  requestId?: string;
  body?: ApiResponseData;
  url?: string;
  method?: string;

  constructor(message: string, options: { status: number; requestId?: string; body?: ApiResponseData; url?: string; method?: string }) {
    super(message);
    this.status = options.status;
    this.requestId = options.requestId;
    this.body = options.body;
    this.url = options.url;
    this.method = options.method;
  }
}

const AUTH_TOAST_THROTTLE_MS = 10000;
let lastAuthToastAt = 0;

function notifyAuthError() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastAuthToastAt < AUTH_TOAST_THROTTLE_MS) return;
  lastAuthToastAt = now;

  const reloadAction =
    React.createElement(
      ToastAction,
      { altText: "Reload", onClick: () => window.location.reload() },
      "Reload",
    ) as unknown as React.ReactElement<typeof ToastAction>;

  toast({
    title: "Auth/CSRF missing — refresh page",
    description: "Your session may have expired or a CSRF token is missing.",
    variant: "destructive",
    action: reloadAction,
  });
}

function isJsonResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json");
}

async function readResponseBody(res: Response): Promise<ApiResponseData> {
  if (res.status === 204) return null;
  if (isJsonResponse(res)) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function extractMessage(body: ApiResponseData, fallback: string) {
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    const message = obj.message || obj.error || obj.detail;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const requestId = res.headers.get("x-request-id") || undefined;
  const data = await readResponseBody(res.clone());
  return { response: res, data, requestId };
}

async function throwIfResNotOk(res: Response, data: ApiResponseData, requestId?: string, url?: string, method?: string) {
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      notifyAuthError();
    }
    const message = extractMessage(data, res.statusText || "Request failed");
    throw new ApiError(message, { status: res.status, requestId, body: data, url, method });
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const { response, data: responseBody, requestId } = await apiFetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(response, responseBody, requestId, url, method);
  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const { response, data, requestId } = await apiFetch(url, { credentials: "include" });
    if (options.on401 === "returnNull" && response.status === 401) {
      return null as T;
    }
    await throwIfResNotOk(response, data, requestId, url, "GET");
    return data as T;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
