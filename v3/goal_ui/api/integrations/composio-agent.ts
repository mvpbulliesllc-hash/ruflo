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

  if (!env("ANTHROPIC_API_KEY")) {
    return sendJson(res, 501, {
      error: "model_key_missing",
      status: "ready_for_model_key",
      prompt,
      userId,
      model: env("ECO_AI_MODEL") || "claude-sonnet-4-6",
      detail: "COMPOSIO_API_KEY is stored server-side. Add ANTHROPIC_API_KEY to enable live Vercel AI SDK + Composio tool execution.",
    });
  }

  sendJson(res, 501, {
    error: "sdk_runtime_not_enabled",
    model: env("ECO_AI_MODEL") || "claude-sonnet-4-6",
    userId,
    prompt,
    detail: "The server route is reserved for the Vercel AI SDK + Composio runtime. Install @composio/core, @composio/vercel, ai, and @ai-sdk/anthropic before enabling live tool execution.",
  });
}
