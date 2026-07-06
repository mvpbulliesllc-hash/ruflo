import { createHmac, timingSafeEqual } from "crypto";
import { env, methodNotAllowed, sendJson, type VercelRequest } from "../_shared.js";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function sign(value: string) {
  const secret = env("AUTH0_SECRET") || env("INNGEST_SIGNING_KEY") || env("ECO_AI_ADMIN_PASSWORD");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function sessionValue(req: VercelRequest) {
  const cookie = Array.isArray(req.headers.cookie) ? req.headers.cookie.join(";") : req.headers.cookie || "";
  const match = cookie.match(/(?:^|; )eco_ai_session=([^;]+)/);
  return match?.[1] || "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const value = sessionValue(req);
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return sendJson(res, 200, { authenticated: false });

  const expected = sign(exp);
  const ok =
    Buffer.from(expected).length === Buffer.from(sig).length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  sendJson(res, 200, { authenticated: ok });
}
