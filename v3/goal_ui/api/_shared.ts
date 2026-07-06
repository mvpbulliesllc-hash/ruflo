type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export type VercelRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

export function sendJson(res: VercelResponse, status: number, body: unknown) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

export function methodNotAllowed(res: VercelResponse, allowed: string[]) {
  res.setHeader("Allow", allowed.join(", "));
  sendJson(res, 405, { error: "method_not_allowed", allowed });
}

export function env(name: string) {
  return process.env[name]?.trim() || "";
}

export function siteUrl(req: VercelRequest) {
  const configured = env("ECO_AI_SITE_URL");
  if (configured) return configured.replace(/\/$/, "");

  const host = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host;
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || "https";
  return host ? `${proto}://${host}` : "https://ecoaisolutions.com";
}

export async function readJson<T extends Record<string, unknown>>(req: VercelRequest): Promise<T> {
  if (!req.body) return {} as T;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}") as T;
  return req.body as T;
}

export async function checkedFetch(
  url: string,
  init: RequestInit,
  okCodes: number[] = [200],
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return {
      ok: okCodes.includes(response.status),
      status: response.status,
      body,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function hasValue(value: string) {
  return value.length > 0;
}

