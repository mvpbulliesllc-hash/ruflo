import { checkedFetch, env, hasValue, methodNotAllowed, sendJson, type VercelRequest } from "../_shared.js";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type IntegrationStatus = {
  id: string;
  name: string;
  configured: boolean;
  ok: boolean;
  mode: "live" | "test" | "link" | "server" | "needs_model" | "configured" | "model";
  message: string;
};

async function statusFromFetch(
  id: string,
  name: string,
  configured: boolean,
  mode: IntegrationStatus["mode"],
  request: () => Promise<{ ok: boolean; status: number }>,
): Promise<IntegrationStatus> {
  if (!configured) {
    return { id, name, configured, ok: false, mode, message: "Missing server env" };
  }
  try {
    const result = await request();
    return {
      id,
      name,
      configured,
      ok: result.ok,
      mode,
      message: result.ok ? "Connected" : `API returned ${result.status}`,
    };
  } catch (error) {
    return {
      id,
      name,
      configured,
      ok: false,
      mode,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const stripeMode = env("STRIPE_MODE") || "test";
  const stripeKey =
    stripeMode === "live"
      ? env("STRIPE_SECRET_KEY") || env("STRIPE_RESTRICTED_KEY_LIVE")
      : env("STRIPE_SECRET_KEY_TEST");
  const githubToken = env("GITHUB_PAT_TOKEN") || env("GITHUB_API_PAT_TOKEN");
  const vercelToken = env("VERCEL_API_TOKEN");
  const elevenLabsKey = env("ELEVENLABS_API_KEY") || env("ELEVEN_LABS_API_KEY");
  const composioKey = env("COMPOSIO_API_KEY");
  const modelKey = env("NOUS_API_KEY") || env("HERMES_API_KEY");
  const modelName = env("NOUS_MODEL") || env("ECO_AI_MODEL") || "nvidia/nemotron-3-ultra-550b-a55b";

  const checks = await Promise.all([
    statusFromFetch("stripe", "Stripe", hasValue(stripeKey), stripeMode === "live" ? "live" : "test", () =>
      checkedFetch("https://api.stripe.com/v1/account", {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }),
    ),
    statusFromFetch("github", "GitHub", hasValue(githubToken), "server", () =>
      checkedFetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
        },
      }),
    ),
    statusFromFetch("vercel", "Vercel", hasValue(vercelToken), "server", () =>
      checkedFetch("https://api.vercel.com/v2/user", {
        headers: { Authorization: `Bearer ${vercelToken}` },
      }),
    ),
    statusFromFetch("attio", "Attio", hasValue(env("ATTIO_API_KEY")), "server", () =>
      checkedFetch("https://api.attio.com/v2/objects", {
        headers: { Authorization: `Bearer ${env("ATTIO_API_KEY")}` },
      }),
    ),
    statusFromFetch("elevenlabs", "ElevenLabs", hasValue(elevenLabsKey), "server", () =>
      checkedFetch("https://api.elevenlabs.io/v1/user/subscription", {
        headers: { "xi-api-key": elevenLabsKey },
      }),
    ),
  ]);

  const passive: IntegrationStatus[] = [
    {
      id: "slack",
      name: "Slack",
      configured: hasValue(env("SLACK_INVITE_URL")),
      ok: hasValue(env("SLACK_INVITE_URL")),
      mode: "link",
      message: hasValue(env("SLACK_INVITE_URL")) ? "Invite link ready" : "Missing invite URL",
    },
    {
      id: "clay",
      name: "Clay",
      configured: hasValue(env("CLAY_API_KEY")),
      ok: hasValue(env("CLAY_API_KEY")),
      mode: "configured",
      message: "Key stored. Clay has no universal account health endpoint.",
    },
    {
      id: "airbyte",
      name: "Airbyte",
      configured: hasValue(env("AIRBYTE_CONNECTORS_URL")),
      ok: hasValue(env("AIRBYTE_CONNECTORS_URL")),
      mode: "link",
      message: "Connector console link ready",
    },
    {
      id: "nous",
      name: "Nous / Hermes",
      configured: hasValue(modelKey),
      ok: hasValue(modelKey),
      mode: "model",
      message: hasValue(modelKey) ? "Model endpoint key ready" : "Missing model API key",
    },
    {
      id: "composio",
      name: "Composio",
      configured: hasValue(composioKey),
      ok: hasValue(composioKey),
      mode: hasValue(modelKey) ? "server" : "needs_model",
      message: hasValue(modelKey)
        ? "Tool router key and Nous model key ready"
        : "Tool router key ready. Add NOUS_API_KEY or HERMES_API_KEY to run model calls.",
    },
  ];

  sendJson(res, 200, {
    generatedAt: new Date().toISOString(),
    model: {
      name: modelName,
      configured: hasValue(modelKey),
      provider: "nousresearch",
    },
    integrations: [...checks, ...passive],
  });
}
