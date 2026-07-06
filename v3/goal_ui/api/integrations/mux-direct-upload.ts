import { env, methodNotAllowed, sendJson, type VercelRequest } from "../_shared.js";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function muxAuth() {
  const tokenId = env("MUX_TOKEN_ID");
  const tokenSecret = env("MUX_TOKEN_SECRET");
  return tokenId && tokenSecret ? `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64")}` : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const auth = muxAuth();
  if (!auth) return sendJson(res, 500, { error: "mux_not_configured" });

  const response = await fetch("https://api.mux.com/video/v1/uploads", {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cors_origin: "*",
      new_asset_settings: {
        playback_policies: ["public"],
      },
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return sendJson(res, response.status, {
      error: "mux_error",
      detail: data?.error?.messages?.[0] || data?.error?.message || `Mux returned ${response.status}`,
    });
  }

  sendJson(res, 200, {
    id: data?.data?.id,
    url: data?.data?.url,
    status: data?.data?.status,
  });
}
