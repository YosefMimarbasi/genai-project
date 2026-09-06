import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

/**
 * Calls one of this repo's own API routes with the current Supabase
 * session's access token attached. Use this instead of a bare `fetch` so
 * every feature branch authenticates the same way.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(path, { ...init, headers });
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Convenience wrapper for the common case: send JSON, expect JSON, throw a
 * typed `ApiError` (with the route's own error message) on a non-2xx
 * response instead of making every call site check `response.ok` itself.
 */
export async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      json && typeof json === "object" && "error" in json && typeof json.error === "string"
        ? json.error
        : `Request to ${path} failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return json as T;
}
