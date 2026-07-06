import { env, methodNotAllowed, readJson, sendJson, type VercelRequest } from "../_shared.js";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const key = env("ELEVENLABS_API_KEY") || env("ELEVEN_LABS_API_KEY");
  const voiceId = env("ELEVENLABS_VOICE_ID") || "JBFqnCBsd6RMkjVDRZzb";
  if (!key) return sendJson(res, 500, { error: "elevenlabs_not_configured" });

  const body = await readJson<{ text?: string }>(req);
  const text = String(body.text || "Eco AI is online and ready to coordinate your next workflow.").slice(0, 280);

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return sendJson(res, response.status, { error: "elevenlabs_error", detail: detail.slice(0, 500) });
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  sendJson(res, 200, {
    mimeType: "audio/mpeg",
    audio: `data:audio/mpeg;base64,${bytes.toString("base64")}`,
  });
}
