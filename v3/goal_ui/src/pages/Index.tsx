import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Headphones,
  Loader2,
  Play,
  RefreshCcw,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";

type IntegrationStatus = {
  id: string;
  name: string;
  configured: boolean;
  ok: boolean;
  mode: string;
  message: string;
};

type IntegrationPayload = {
  generatedAt: string;
  model: {
    name: string;
    provider: string;
    configured: boolean;
  };
  integrations: IntegrationStatus[];
};

type Slide = {
  eyebrow: string;
  title: string;
  description: string;
  gradient: string;
  stat: string;
};

const slides: Slide[] = [
  {
    eyebrow: "Eco AI",
    title: "Autonomous work, without the clutter.",
    description: "A clean operating surface for model calls, payments, voice, CRM data, deploys, and workspace actions.",
    gradient: "radial-gradient(circle at 20% 30%, rgba(74, 144, 226, 0.28), transparent 34%), linear-gradient(135deg, #070708 0%, #171718 48%, #0d0d0e 100%)",
    stat: "Live ops",
  },
  {
    eyebrow: "Nemotron",
    title: "Nous model routing is live.",
    description: "Eco AI now calls the Nous Research endpoint server-side with the Nemotron Ultra model selected.",
    gradient: "radial-gradient(circle at 70% 22%, rgba(92, 225, 168, 0.22), transparent 30%), linear-gradient(135deg, #070807 0%, #141a17 52%, #090a0a 100%)",
    stat: "550B",
  },
  {
    eyebrow: "Revenue",
    title: "Stripe checkout, wired from the UI.",
    description: "The payment path creates server-side Checkout Sessions and stays in test mode until you flip it live.",
    gradient: "radial-gradient(circle at 24% 72%, rgba(255, 255, 255, 0.13), transparent 34%), linear-gradient(135deg, #08080a 0%, #1b1b20 46%, #0a0a0c 100%)",
    stat: "Test mode",
  },
  {
    eyebrow: "Integrations",
    title: "One screen for the whole stack.",
    description: "GitHub, Vercel, Attio, Slack, Clay, Airbyte, ElevenLabs, Stripe, Composio, and Nous report their state here.",
    gradient: "radial-gradient(circle at 72% 70%, rgba(190, 190, 255, 0.2), transparent 32%), linear-gradient(135deg, #08080a 0%, #181820 50%, #0b0b0d 100%)",
    stat: "10 links",
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function readApiJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Live API is only available on the Vercel deployment.");
  }
  return response.json() as Promise<T>;
}

export default function Index() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [integrationPayload, setIntegrationPayload] = useState<IntegrationPayload | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("Eco AI is ready.");
  const [prompt, setPrompt] = useState("Say Eco AI online in one clean sentence.");

  const activeSlide = slides[activeIndex];
  const connectedCount = integrationPayload?.integrations.filter((item) => item.ok).length ?? 0;
  const modelStatus = integrationPayload?.model.configured ? "ready" : "missing";

  const visibleIntegrations = useMemo(() => {
    const order = ["nous", "stripe", "github", "vercel", "attio", "composio", "elevenlabs", "slack", "clay", "airbyte"];
    return [...(integrationPayload?.integrations ?? [])].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [integrationPayload]);

  const goToSlide = (index: number) => {
    setActiveIndex((index + slides.length) % slides.length);
    setProgress(0);
  };

  const refreshIntegrations = async () => {
    setBusyAction("refresh");
    try {
      const response = await fetch("/api/integrations/status");
      const data = await readApiJson<IntegrationPayload>(response);
      setIntegrationPayload(data);
      setActionMessage(response.ok ? "Integration status refreshed." : "Status check returned an error.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Integration status failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const startCheckout = async () => {
    setBusyAction("stripe");
    try {
      const response = await fetch("/api/integrations/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 2500, label: "Eco AI strategy session" }),
      });
      const data = await readApiJson<{ url?: string; mode?: string; detail?: string; error?: string }>(response);
      if (!response.ok) throw new Error(data.detail || data.error || "Stripe checkout failed");
      window.open(data.url, "_blank", "noopener,noreferrer");
      setActionMessage(`Stripe checkout created in ${data.mode} mode.`);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Stripe checkout failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const testVoice = async () => {
    setBusyAction("voice");
    try {
      const response = await fetch("/api/integrations/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Eco AI integrations are online and ready." }),
      });
      const data = await readApiJson<{ audio?: string; detail?: string; error?: string }>(response);
      if (!response.ok) throw new Error(data.detail || data.error || "Voice generation failed");
      const audio = new Audio(data.audio);
      await audio.play();
      setActionMessage("ElevenLabs voice generated and playing.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Voice generation failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const testModel = async () => {
    setBusyAction("model");
    try {
      const response = await fetch("/api/integrations/nous-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, maxTokens: 96 }),
      });
      const data = await readApiJson<{ content?: string; detail?: string; error?: string }>(response);
      if (!response.ok) throw new Error(data.detail || data.error || "Model call failed");
      setActionMessage(data.content || "Nous model call completed.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Model call failed.");
    } finally {
      setBusyAction(null);
    }
  };

  useEffect(() => {
    void refreshIntegrations();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          setActiveIndex((index) => (index + 1) % slides.length);
          return 0;
        }
        return current + 1;
      });
    }, 55);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="eco-slider" style={{ "--slide-gradient": activeSlide.gradient } as React.CSSProperties}>
      <div className="slider-bg" />
      <div className="slider-noise" />

      <header className="slider-header">
        <div className="brand-mark" aria-label="Eco AI">
          <Sparkles size={17} />
          <span>Eco AI</span>
        </div>
        <div className="header-status">
          <span>{connectedCount} connected</span>
          <span>{integrationPayload?.model.provider ?? "nousresearch"}</span>
          <span>model {modelStatus}</span>
        </div>
      </header>

      <section className="hero-stage" aria-label="Eco AI control surface">
        <button className="slider-arrow left" type="button" onClick={() => goToSlide(activeIndex - 1)} aria-label="Previous slide">
          <ArrowLeft size={20} />
        </button>

        <div className="hero-copy" key={activeSlide.title}>
          <span className="slide-eyebrow">{activeSlide.eyebrow}</span>
          <h1>{activeSlide.title}</h1>
          <p>{activeSlide.description}</p>
          <div className="hero-actions">
            <button className="primary-glass" type="button" onClick={testModel} disabled={busyAction !== null}>
              {busyAction === "model" ? <Loader2 size={18} className="spin" /> : <Play size={18} />}
              Run model
            </button>
            <button className="secondary-glass" type="button" onClick={refreshIntegrations} disabled={busyAction !== null}>
              {busyAction === "refresh" ? <Loader2 size={18} className="spin" /> : <RefreshCcw size={18} />}
              Refresh
            </button>
          </div>
        </div>

        <aside className="control-glass" aria-label="Live controls">
          <div className="panel-topline">
            <span>{activeSlide.stat}</span>
            <span>{String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
          </div>

          <div className="model-card">
            <span>Active model</span>
            <strong>{integrationPayload?.model.name ?? "nvidia/nemotron-3-ultra-550b-a55b"}</strong>
            <em>{actionMessage}</em>
          </div>

          <div className="prompt-box">
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Model prompt" />
            <button className="send-button" type="button" onClick={testModel} disabled={busyAction !== null}>
              {busyAction === "model" ? <Loader2 size={17} className="spin" /> : <Send size={17} />}
            </button>
          </div>

          <div className="quick-actions">
            <button type="button" onClick={startCheckout} disabled={busyAction !== null}>
              <CreditCard size={16} />
              Stripe
            </button>
            <button type="button" onClick={testVoice} disabled={busyAction !== null}>
              <Headphones size={16} />
              Voice
            </button>
          </div>

          <div className="integration-list">
            {visibleIntegrations.map((item) => (
              <div className="integration-row" key={item.id}>
                <span className={cx("status-dot", item.ok ? "ok" : item.configured ? "warn" : "off")} />
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.message}</span>
                </div>
                <em>{item.mode}</em>
              </div>
            ))}
            {!integrationPayload && (
              <div className="empty-status">
                <Zap size={16} />
                <span>Loading integrations...</span>
              </div>
            )}
          </div>
        </aside>

        <button className="slider-arrow right" type="button" onClick={() => goToSlide(activeIndex + 1)} aria-label="Next slide">
          <ArrowRight size={20} />
        </button>
      </section>

      <footer className="slider-pagination" aria-label="Slide pagination">
        <div className="pagination-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              className={cx("dot-button", index === activeIndex && "active")}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Go to ${slide.eyebrow}`}
            >
              <span />
              {index === activeIndex && (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="10" style={{ strokeDashoffset: 62.83 * (1 - progress / 100) }} />
                </svg>
              )}
            </button>
          ))}
        </div>
        <div className="mini-proof">
          <Check size={14} />
          <span>Vercel production deployment active</span>
        </div>
      </footer>
    </main>
  );
}
