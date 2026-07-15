import { useAuthStore } from "@/lib/stores/auth.store";

// Default to same-origin ("") so the browser hits the frontend host and the
// Next.js rewrite in next.config.ts proxies /api/* to the backend server-side.
// This keeps the auth cookie first-party (required for mobile Safari/Chrome).
// Only override with NEXT_PUBLIC_API_URL for direct-to-backend debugging.
export const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
  }
}

function clearAuthAndRedirect() {
  if (typeof window === "undefined") return;
  useAuthStore.getState().clearAuth();
  window.location.href = "/sign-in";
}

// Auth endpoints must never trigger the session-refresh/redirect logic:
// a 401 from these means "bad credentials"/"invalid token", not "expired session".
const AUTH_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/complete-registration",
];

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = fetch(`${BASE}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

async function request<T>(path: string, init?: RequestInit, _retried = false): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const headers: Record<string, string> = {
    "Accept": "application/json",
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...(init?.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (res.status === 401 && !_retried && !AUTH_PATHS.includes(path)) {
    if (await tryRefresh()) {
      return request<T>(path, init, true);
    }
    clearAuthAndRedirect();
    throw new ApiError(401, "Session expired — please sign in again");
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail ?? body.message ?? body.error ?? detail;
    } catch {
    }
    throw new ApiError(res.status, detail);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body != null ? JSON.stringify(body) : undefined }),
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body != null ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body: body != null ? JSON.stringify(body) : undefined }),
};
