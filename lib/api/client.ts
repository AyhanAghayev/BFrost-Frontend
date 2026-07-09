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

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return useAuthStore.getState().accessToken ?? null;
}

function storeNewToken(token: string) {
  if (typeof window === "undefined") return;
  useAuthStore.getState().setAccessToken(token);
}

function clearAuthAndRedirect() {
  if (typeof window === "undefined") return;
  useAuthStore.getState().clearAuth();
  window.location.href = "/sign-in";
}

let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = fetch(`${BASE}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      return data.accessToken as string ?? null;
    })
    .catch(() => null)
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  tokenOverride?: string,
  _retried = false
): Promise<T> {
  const token = tokenOverride ?? getToken();
  const isForm = init?.body instanceof FormData;
  const headers: Record<string, string> = {
    "Accept": "application/json",
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (res.status === 401 && !_retried && path !== "/api/v1/auth/refresh") {
    const newToken = await tryRefresh();
    if (newToken) {
      storeNewToken(newToken);
      return request<T>(path, init, newToken, true);
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
  get: <T>(path: string, tokenOverride?: string) => request<T>(path, undefined, tokenOverride),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body != null ? JSON.stringify(body) : undefined }),
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body != null ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body: body != null ? JSON.stringify(body) : undefined }),
};
