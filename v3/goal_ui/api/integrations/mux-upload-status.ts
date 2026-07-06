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

function queryParam(req: VercelRequest, name: string) {
  const host = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host || "ecoaisolutions.com";
  const url = new URL(String((req as VercelRequest & { url?: string }).url || "/"), `https://${host}`);
  return url.searchParams.get(name) || "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const auth = muxAuth();
  const id = queryParam(req, "id");
  if (!auth) return sendJson(res, 500, { error: "mux_not_configured" });
  if (!id) return sendJson(res, 400, { error: "missing_upload_id" });

  const uploadResponse = await fetch(`https://api.mux.com/video/v1/uploads/${encodeURIComponent(id)}`, {
    headers: { Authorization: auth },
  });
  const upload = await uploadResponse.json().catch(() => null);
  if (!uploadResponse.ok) {
    return sendJson(res, uploadResponse.status, { error: "mux_error", detail: upload?.error?.message || "Upload lookup failed" });
  }

  const assetId = upload?.data?.asset_id;
  if (!assetId) {
    return sendJson(res, 200, {
      id,
      status: upload?.data?.status,
      assetId: null,
      playbackId: null,
    });
  }

  const assetResponse = await fetch(`https://api.mux.com/video/v1/assets/${encodeURIComponent(assetId)}`, {
    headers: { Authorization: auth },
  });
  const asset = await assetResponse.json().catch(() => null);
  if (!assetResponse.ok) {
    return sendJson(res, assetResponse.status, { error: "mux_error", detail: asset?.error?.message || "Asset lookup failed" });
  }

  sendJson(res, 200, {
    id,
    status: upload?.data?.status,
    assetId,
    assetStatus: asset?.data?.status,
    playbackId: asset?.data?.playback_ids?.[0]?.id || null,
  });
}
