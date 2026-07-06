import { env, methodNotAllowed, readJson, sendJson, type VercelRequest } from "../_shared.js";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  if (!env("COMPOSIO_API_KEY")) return sendJson(res, 500, { error: "composio_not_configured" });
  const body = await readJson<{ prompt?: string; userId?: string }>(req);
  const prompt = String(body.prompt || "List the available Composio tool router capabilities.").slice(0, 1000);
  const userId = String(body.userId || env("COMPOSIO_USER_ID") || "eco-ai-user").slice(0, 120);
  const modelKey = env("NOUS_API_KEY") || env("HERMES_API_KEY");
  const model = env("NOUS_MODEL") || env("ECO_AI_MODEL") || "nvidia/nemotron-3-ultra-550b-a55b";

  if (!modelKey) {
    return sendJson(res, 501, {
      error: "model_key_missing",
      status: "ready_for_model_key",
      prompt,
      userId,
      model,
      detail: "COMPOSIO_API_KEY is stored server-side. Add NOUS_API_KEY or HERMES_API_KEY to enable live model calls.",
    });
  }

  sendJson(res, 501, {
    error: "sdk_runtime_not_enabled",
    model,
    userId,
    prompt,
    detail: "The server route is reserved for Composio tool execution. The Nous model route is live at /api/integrations/nous-chat.",
  });
}
