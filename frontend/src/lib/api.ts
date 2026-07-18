import * as Sentry from "@sentry/react";

const raw = import.meta.env.VITE_API_URL;
const base = typeof raw === "string" ? raw.replace(/\/+$/, "") : ""; // remove trailing slashes

type ApiFetchOpts = {
  getToken?: () => Promise<string | null | undefined>;
  method?: string;
  body?: unknown;
};

// this is an authenticated fetch req that we use to send reqs to our api
export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiFetchOpts = {}
): Promise<T> {
  const { getToken, method = "GET", body } = opts; // method = "GET" says the default method is "GET" is no method is defined
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (getToken) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    Sentry.addBreadcrumb({ // th
      category: "api",
      message: `${method} ${path}`,
      level: "error",
      data: { network: true },
    }); //doesn't send anything to Sentry by itself. It just appends a small record ("category/message/level/data") to an in-memory trail that gets attached to whatever error is captured next. Think of it like a rolling log of "what happened before the crash" — useful for debugging context (e.g. "GET /users failed" → then 2 breadcrumbs later → "POST /orders threw"). Cheap, and doesn't create a Sentry issue on its own.

    Sentry.captureException(e, {
      tags: { "api.fetch": "network" },
      extra: { path, method },
    }); // this is what actually creates a Sentry event/issue you'll see in the dashboard, with the stack trace, tags (api.fetch, http.status), extra context (path, method, status), and all the breadcrumbs collected so far attached to it.

    throw e;
  }

  const data = await res.json();

  Sentry.addBreadcrumb({
    category: "api",
    message: `${method} ${path}`,
    level: res.ok ? "info" : "warning",
    data: { status: res.status },
  });

  if (!res.ok) {
    const msg = typeof data?.error === "string" ? data.error : res.statusText;
    const err = new Error(typeof msg === "string" ? msg : "Request failed");

    if (res.status >= 500) {
      Sentry.captureException(err, {
        tags: { "api.fetch": "http", "http.status": String(res.status) },
        extra: { path, method, status: res.status },
      });
    }

    throw err;
  }

  return data as T;
}