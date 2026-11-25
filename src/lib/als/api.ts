// Small fetch helper for the ALS platform

export async function api<T>(
  path: string,
  opts?: { method?: string; body?: unknown; token?: string | null; customer?: boolean }
): Promise<T> {
  const res = await fetch(path, {
    method: opts?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts?.token ? { [opts.customer ? "x-customer-token" : "x-staff-token"]: opts.token } : {}),
    },
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

// very light in-browser rate limiting for forms (spam protection helper)
const lastPost: Record<string, number> = {};
export function throttle(key: string, ms = 8000): boolean {
  const now = Date.now();
  if (lastPost[key] && now - lastPost[key] < ms) return false;
  lastPost[key] = now;
  return true;
}
