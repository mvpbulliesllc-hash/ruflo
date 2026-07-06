import { env, methodNotAllowed, sendJson, type VercelRequest } from "../_shared.js";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  sendJson(res, 200, {
    playbackId: env("MUX_PLAYBACK_ID"),
    configured: Boolean(env("MUX_PLAYBACK_ID")),
  });
}
