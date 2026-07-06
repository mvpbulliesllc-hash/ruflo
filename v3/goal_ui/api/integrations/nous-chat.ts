import { env, methodNotAllowed, readJson, sendJson, type VercelRequest } from "../_shared.js";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const key = env("NOUS_API_KEY") || env("HERMES_API_KEY");
  if (!key) return sendJson(res, 500, { error: "nous_not_configured" });

  const body = await readJson<{ messages?: ChatMessage[]; prompt?: string; maxTokens?: number }>(req);
  const prompt = String(body.prompt || "Say Eco AI model routing is online.").slice(0, 2000);
  const messages =
    Array.isArray(body.messages) && body.messages.length > 0
      ? body.messages.map((message) => ({
          role: message.role,
          content: String(message.content || "").slice(0, 4000),
        }))
      : [
          { role: "system", content: "You are Eco AI, a concise operational assistant." },
          { role: "user", content: prompt },
        ];

  const response = await fetch("https://inference-api.nousresearch.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env("NOUS_MODEL") || env("ECO_AI_MODEL") || "nvidia/nemotron-3-ultra-550b-a55b",
      messages,
      max_tokens: Math.min(Math.max(Number(body.maxTokens || 128), 1), 512),
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return sendJson(res, response.status, {
      error: "nous_error",
      detail:
        typeof data?.error === "string"
          ? data.error
          : data?.error?.message || data?.message || `Model endpoint returned ${response.status}`,
    });
  }

  sendJson(res, 200, {
    model: data?.model,
    content: data?.choices?.[0]?.message?.content || "",
    usage: data?.usage,
  });
}
