import { env, methodNotAllowed, readJson, sendJson, type VercelRequest } from "../_shared.js";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const eventKey = env("INNGEST_EVENT_KEY");
  if (!eventKey) return sendJson(res, 500, { error: "inngest_not_configured" });

  const body = await readJson<{ name?: string; data?: Record<string, unknown> }>(req);
  const name = String(body.name || "ecoai/ops.command.requested").slice(0, 160);
  const data = {
    source: "eco-ai-back-office",
    requestedAt: new Date().toISOString(),
    ...(body.data || {}),
  };

  const response = await fetch(`https://inn.gs/e/${encodeURIComponent(eventKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    return sendJson(res, response.status, {
      error: "inngest_error",
      detail: result?.error || result?.message || `Inngest returned ${response.status}`,
    });
  }

  sendJson(res, 200, {
    name,
    ids: result?.ids || [],
    status: result?.status || response.status,
  });
}
