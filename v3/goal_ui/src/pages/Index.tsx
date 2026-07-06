import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Brain,
  Check,
  ChevronRight,
  CreditCard,
  Database,
  GitBranch,
  Headphones,
  Loader2,
  Network,
  Pause,
  Play,
  Radar,
  RefreshCcw,
  Route,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Zap,
} from "lucide-react";

type RunState = "ready" | "running" | "paused" | "complete";
type StepStatus = "pending" | "active" | "complete";

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

type PlanStep = {
  id: string;
  title: string;
  description: string;
  icon: typeof Search;
  detail: string[];
};

const planSteps: PlanStep[] = [
  {
    id: "goal",
    title: "Goal analysis",
    description: "Parse the requested outcome into constraints, dependencies, and success criteria.",
    icon: Search,
    detail: ["Extract required outcome", "Rank risk", "Map finish state"],
  },
  {
    id: "state",
    title: "Workspace assessment",
    description: "Inspect repo state, deployment surface, API routes, and provider readiness.",
    icon: Radar,
    detail: ["Read project scripts", "Check API env", "Confirm deploy target"],
  },
  {
    id: "context",
    title: "Context retrieval",
    description: "Pull integration status, model config, and reusable runtime context.",
    icon: Database,
    detail: ["Refresh integrations", "Attach model", "Load route health"],
  },
  {
    id: "plan",
    title: "Plan synthesis",
    description: "Build a short execution path and assign work lanes to the active agents.",
    icon: GitBranch,
    detail: ["Sequence work", "Split lanes", "Set gates"],
  },
  {
    id: "execute",
    title: "Execution",
    description: "Run the model, trigger provider actions, and stream operational feedback.",
    icon: Zap,
    detail: ["Call model", "Create checkout", "Play voice route"],
  },
  {
    id: "verify",
    title: "Verification",
    description: "Check build, deployment, integrations, and operator-facing result state.",
    icon: ShieldCheck,
    detail: ["Smoke test UI", "Verify API", "Report blocker"],
  },
];

const agents = [
  { name: "Planner", role: "Goal decomposition", load: 18 },
  { name: "Research", role: "Context scan", load: 12 },
  { name: "Builder", role: "Implementation lane", load: 28 },
  { name: "Reviewer", role: "Quality gates", load: 10 },
  { name: "Ops", role: "Deploy and observe", load: 16 },
];

const defaultGoal = "Launch Eco AI as a production agent planning console on ecoaisolutions.com";

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
  const [goal, setGoal] = useState(defaultGoal);
  const [prompt, setPrompt] = useState("Say Eco AI online in one clean sentence.");
  const [runState, setRunState] = useState<RunState>("ready");
  const [activeStep, setActiveStep] = useState(0);
  const [selectedStep, setSelectedStep] = useState(planSteps[0]);
  const [integrationPayload, setIntegrationPayload] = useState<IntegrationPayload | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("Eco AI is ready.");

  const connectedCount = integrationPayload?.integrations.filter((item) => item.ok).length ?? 0;
  const progress =
    runState === "ready"
      ? 0
      : Math.min(100, Math.round(((activeStep + (runState === "complete" ? 1 : 0)) / planSteps.length) * 100));

  const visibleIntegrations = useMemo(() => {
    const order = ["nous", "stripe", "github", "vercel", "attio", "composio", "elevenlabs", "slack", "clay", "airbyte"];
    return [...(integrationPayload?.integrations ?? [])].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [integrationPayload]);

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

  const testModel = async (sourcePrompt = prompt) => {
    setBusyAction("model");
    try {
      const response = await fetch("/api/integrations/nous-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: sourcePrompt, maxTokens: 128 }),
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

  const runPlan = () => {
    setRunState("running");
    setActiveStep(0);
    setSelectedStep(planSteps[0]);
    setActionMessage("Execution plan started.");
    void refreshIntegrations();
  };

  const toggleRun = () => {
    if (runState === "ready" || runState === "complete") {
      runPlan();
      return;
    }
    setRunState((current) => (current === "running" ? "paused" : "running"));
  };

  const resetPlan = () => {
    setRunState("ready");
    setActiveStep(0);
    setSelectedStep(planSteps[0]);
    setActionMessage("Plan reset.");
  };

  useEffect(() => {
    void refreshIntegrations();
  }, []);

  useEffect(() => {
    if (runState !== "running") return undefined;

    const timer = window.setTimeout(() => {
      setActiveStep((current) => {
        if (current >= planSteps.length - 1) {
          setRunState("complete");
          setSelectedStep(planSteps[planSteps.length - 1]);
          setActionMessage("Plan complete. Verify deployment and integrations.");
          void testModel(`Summarize this Eco AI goal in one sentence: ${goal}`);
          return current;
        }
        const next = current + 1;
        setSelectedStep(planSteps[next]);
        return next;
      });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [runState, activeStep, goal]);

  return (
    <main className="eco-console">
      <div className="ambient-bg" />
      <div className="grid-noise" />

      <header className="topbar">
        <div className="brand-mark" aria-label="Eco AI">
          <Sparkles size={17} />
          <span>Eco AI</span>
        </div>
        <div className="top-status">
          <span>{connectedCount} connected</span>
          <span>{integrationPayload?.model.provider ?? "nousresearch"}</span>
          <span>{runState}</span>
        </div>
      </header>

      <section className="hero-workspace" aria-label="Eco AI workspace">
        <div className="hero-copy">
          <span className="section-label">Eco AI</span>
          <h1>Autonomous work, without the clutter.</h1>
          <p>A clean operating surface for model calls, payments, voice, CRM data, deploys, and workspace actions.</p>

          <div className="goal-card">
            <label htmlFor="goal">Goal</label>
            <textarea id="goal" value={goal} onChange={(event) => setGoal(event.target.value)} />
            <div className="hero-actions">
              <button className="primary-glass" type="button" onClick={toggleRun} disabled={busyAction !== null}>
                {runState === "running" ? <Pause size={18} /> : <Play size={18} />}
                {runState === "running" ? "Pause plan" : "Run plan"}
              </button>
              <button className="secondary-glass" type="button" onClick={resetPlan}>
                Reset
              </button>
              <button className="secondary-glass" type="button" onClick={refreshIntegrations} disabled={busyAction !== null}>
                {busyAction === "refresh" ? <Loader2 size={18} className="spin" /> : <RefreshCcw size={18} />}
                Refresh
              </button>
            </div>
          </div>
        </div>

        <aside className="control-glass" aria-label="Live controls">
          <div className="panel-topline">
            <span>Live controls</span>
            <span>{progress}%</span>
          </div>

          <div className="model-card">
            <span>Active model</span>
            <strong>{integrationPayload?.model.name ?? "nvidia/nemotron-3-ultra-550b-a55b"}</strong>
            <em>{actionMessage}</em>
          </div>

          <div className="prompt-box">
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Model prompt" />
            <button className="send-button" type="button" onClick={() => testModel()} disabled={busyAction !== null}>
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
        </aside>
      </section>

      <section className="ops-grid" aria-label="Execution console">
        <div className="glass-panel timeline-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">Execution</span>
              <h2>Plan timeline</h2>
            </div>
            <div className="progress-ring">{progress}%</div>
          </div>

          <div className="timeline-list">
            {planSteps.map((step, index) => {
              const Icon = step.icon;
              const status: StepStatus =
                runState === "complete" || index < activeStep ? "complete" : index === activeStep && runState !== "ready" ? "active" : "pending";
              return (
                <button
                  className={cx("timeline-row", status)}
                  key={step.id}
                  type="button"
                  onClick={() => setSelectedStep(step)}
                >
                  <span className="row-icon">
                    <Icon size={18} />
                  </span>
                  <div>
                    <strong>{step.title}</strong>
                    <span>{step.description}</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel detail-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">Selected step</span>
              <h2>{selectedStep.title}</h2>
            </div>
            <Activity size={18} />
          </div>
          <p>{selectedStep.description}</p>
          <div className="detail-list">
            {selectedStep.detail.map((item) => (
              <span key={item}>
                <Check size={14} />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">Agents</span>
              <h2>Swarm state</h2>
            </div>
            <Brain size={18} />
          </div>
          <div className="agent-list">
            {agents.map((agent, index) => {
              const isActive = runState === "running" && index === activeStep % agents.length;
              const isDone = runState === "complete" || index < activeStep % agents.length;
              return (
                <div className="agent-row" key={agent.name}>
                  <span className={cx("status-dot", isActive ? "warn" : isDone ? "ok" : "off")} />
                  <div>
                    <strong>{agent.name}</strong>
                    <span>{agent.role}</span>
                  </div>
                  <meter min={0} max={100} value={isActive ? 78 : agent.load} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel integrations-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">Integrations</span>
              <h2>{connectedCount} connected</h2>
            </div>
            <button className="icon-button" type="button" onClick={refreshIntegrations} aria-label="Refresh integrations">
              {busyAction === "refresh" ? <Loader2 size={17} className="spin" /> : <RefreshCcw size={17} />}
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
        </div>
      </section>
    </main>
  );
}
