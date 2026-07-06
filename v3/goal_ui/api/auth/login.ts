import { createHmac, timingSafeEqual } from "crypto";
import { env, methodNotAllowed, readJson, sendJson, type VercelRequest } from "../_shared.js";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string | string[]) => void;
};

function sign(value: string) {
  const secret = env("AUTH0_SECRET") || env("INNGEST_SIGNING_KEY") || env("ECO_AI_ADMIN_PASSWORD");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const expected = env("ECO_AI_ADMIN_PASSWORD");
  if (!expected) return sendJson(res, 500, { error: "auth_not_configured" });

  const body = await readJson<{ password?: string }>(req);
  const password = String(body.password || "");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(password);
  const matches =
    expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);

  if (!matches) return sendJson(res, 401, { error: "invalid_password" });

  const exp = String(Date.now() + 1000 * 60 * 60 * 8);
  const value = `${exp}.${sign(exp)}`;
  res.setHeader("Set-Cookie", `eco_ai_session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
  sendJson(res, 200, { ok: true });
}
