import { env, methodNotAllowed, readJson, sendJson, siteUrl, type VercelRequest } from "../_shared.js";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const stripeMode = env("STRIPE_MODE") || "test";
  const key =
    stripeMode === "live"
      ? env("STRIPE_SECRET_KEY") || env("STRIPE_RESTRICTED_KEY_LIVE")
      : env("STRIPE_SECRET_KEY_TEST");

  if (!key) return sendJson(res, 500, { error: "stripe_not_configured" });

  const body = await readJson<{ amount?: number; label?: string }>(req);
  const amount = Math.min(Math.max(Number(body.amount || 2500), 100), 500000);
  const label = String(body.label || "Eco AI strategy session").slice(0, 80);
  const origin = siteUrl(req);

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${origin}/?checkout=success`);
  params.set("cancel_url", `${origin}/?checkout=cancelled`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(Math.round(amount)));
  params.set("line_items[0][price_data][product_data][name]", label);
  params.set("metadata[source]", "eco-ai-console");

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2026-02-25.clover",
    },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) return sendJson(res, response.status, { error: "stripe_error", detail: data.error?.message });

  sendJson(res, 200, {
    id: data.id,
    url: data.url,
    mode: stripeMode,
  });
}
