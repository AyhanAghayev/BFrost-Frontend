import { useAuthStore } from "@/lib/stores/auth.store";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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

  if (res.status === 401 && !_retried && path !== "/api/v1/auth/refresh") {
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
