import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Brain,
  Check,
  CreditCard,
  Database,
  GitBranch,
  Headphones,
  Loader2,
  Lock,
  LogOut,
  Network,
  Pause,
  Play,
  Radar,
  RefreshCcw,
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
  owner: string;
  description: string;
  icon: typeof Search;
};

const planSteps: PlanStep[] = [
  {
    id: "triage",
    title: "Triage command",
    owner: "Planner",
    description: "Parse operator intent, classify urgency, and define the next finish state.",
    icon: Search,
  },
  {
    id: "workspace",
    title: "Inspect workspace",
    owner: "Ops",
    description: "Check repo, deployment state, environment variables, and public routes.",
    icon: Radar,
  },
  {
    id: "providers",
    title: "Check providers",
    owner: "Research",
    description: "Refresh model, Stripe, Vercel, GitHub, Attio, Composio, and voice health.",
    icon: Database,
  },
  {
    id: "execute",
    title: "Execute action",
    owner: "Builder",
    description: "Run the model route, trigger provider action, or update the deployed app.",
    icon: Zap,
  },
  {
    id: "verify",
    title: "Verify output",
    owner: "Reviewer",
    description: "Confirm API response, UI state, deployment status, and unresolved blockers.",
    icon: ShieldCheck,
  },
];

const agents = [
  { name: "Planner", role: "Intent routing", lane: "Queue", load: 18 },
  { name: "Research", role: "Provider and context scan", lane: "Inputs", load: 12 },
  { name: "Builder", role: "Repo and deploy changes", lane: "Execution", load: 28 },
  { name: "Reviewer", role: "Checks and regression gates", lane: "QA", load: 10 },
  { name: "Ops", role: "Vercel, DNS, runtime health", lane: "Infra", load: 16 },
];

const navItems = ["Command", "Queue", "Jobs", "Integrations", "Billing", "Voice", "Deploys", "CRM"];
const defaultGoal = "Review provider health, run the Eco AI model route, and surface any blockers.";

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
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [goal, setGoal] = useState(defaultGoal);
  const [prompt, setPrompt] = useState("Give me the current Eco AI operating status in one concise paragraph.");
  const [runState, setRunState] = useState<RunState>("ready");
  const [activeStep, setActiveStep] = useState(0);
  const [selectedStep, setSelectedStep] = useState(planSteps[0]);
  const [integrationPayload, setIntegrationPayload] = useState<IntegrationPayload | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("Standing by for operator command.");
  const [activeNav, setActiveNav] = useState("Command");

  const connectedCount = integrationPayload?.integrations.filter((item) => item.ok).length ?? 0;
  const totalIntegrations = integrationPayload?.integrations.length ?? 0;
  const healthPercent = totalIntegrations ? Math.round((connectedCount / totalIntegrations) * 100) : 0;
  const progress =
    runState === "ready"
      ? 0
      : Math.min(100, Math.round(((activeStep + (runState === "complete" ? 1 : 0)) / planSteps.length) * 100));

  const visibleIntegrations = useMemo(() => {
    const order = ["nous", "inngest", "stripe", "github", "vercel", "attio", "composio", "elevenlabs", "slack", "clay", "airbyte"];
    return [...(integrationPayload?.integrations ?? [])].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [integrationPayload]);

  const eventLines = useMemo(
    () => [
      { label: "operator", value: goal },
      { label: "runtime", value: actionMessage },
      { label: "model", value: integrationPayload?.model.name ?? "nvidia/nemotron-3-ultra-550b-a55b" },
      { label: "health", value: `${connectedCount}/${totalIntegrations || 10} providers connected` },
    ],
    [actionMessage, connectedCount, goal, integrationPayload?.model.name, totalIntegrations],
  );

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await readApiJson<{ authenticated: boolean }>(response);
      setAuthenticated(Boolean(data.authenticated));
    } catch {
      setAuthenticated(false);
    } finally {
      setAuthChecked(true);
    }
  };

  const login = async () => {
    setBusyAction("login");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await readApiJson<{ ok?: boolean; error?: string }>(response);
      if (!response.ok || !data.ok) throw new Error(data.error || "Login failed");
      setPassword("");
      setAuthenticated(true);
      setActionMessage("Operator authenticated.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
  };

  const refreshIntegrations = async () => {
    setBusyAction("refresh");
    try {
      const response = await fetch("/api/integrations/status");
      const data = await readApiJson<IntegrationPayload>(response);
      setIntegrationPayload(data);
      setActionMessage(response.ok ? "Provider status refreshed." : "Status check returned an error.");
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
        body: JSON.stringify({ text: "Eco AI back office is online." }),
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
        body: JSON.stringify({ prompt: sourcePrompt, maxTokens: 160 }),
      });
      const data = await readApiJson<{ content?: string; detail?: string; error?: string }>(response);
      if (!response.ok) throw new Error(data.detail || data.error || "Model call failed");
      setActionMessage(data.content || "Model call completed.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Model call failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const sendInngestEvent = async () => {
    setBusyAction("inngest");
    try {
      const response = await fetch("/api/integrations/inngest-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            command: goal,
            activeStep: selectedStep.id,
            runState,
          },
        }),
      });
      const data = await readApiJson<{ ids?: string[]; detail?: string; error?: string }>(response);
      if (!response.ok) throw new Error(data.detail || data.error || "Inngest event failed");
      setActionMessage(`Inngest event sent${data.ids?.[0] ? `: ${data.ids[0]}` : "."}`);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Inngest event failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const runPlan = () => {
    setRunState("running");
    setActiveStep(0);
    setSelectedStep(planSteps[0]);
    setActionMessage("Operational queue started.");
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
    setActionMessage("Queue reset.");
  };

  useEffect(() => {
    void checkAuth();
  }, []);

  useEffect(() => {
    if (authenticated) void refreshIntegrations();
  }, [authenticated]);

  useEffect(() => {
    if (runState !== "running") return undefined;

    const timer = window.setTimeout(() => {
      setActiveStep((current) => {
        if (current >= planSteps.length - 1) {
          setRunState("complete");
          setSelectedStep(planSteps[planSteps.length - 1]);
          setActionMessage("Queue complete. Review provider health and unresolved errors.");
          void testModel(`Summarize this back-office operation in one paragraph: ${goal}`);
          return current;
        }
        const next = current + 1;
        setSelectedStep(planSteps[next]);
        return next;
      });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [runState, activeStep, goal]);

  if (!authChecked) {
    return (
      <main className="auth-shell">
        <div className="ambient-bg" />
        <div className="grid-noise" />
        <div className="auth-card">
          <Loader2 className="spin" size={22} />
          <span>Checking operator session</span>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="auth-shell">
        <div className="ambient-bg" />
        <div className="grid-noise" />
        <section className="auth-card">
          <div className="brand-mark" aria-label="Eco AI">
            <Sparkles size={17} />
            <span>Eco AI</span>
          </div>
          <Lock size={24} />
          <h1>Operator access</h1>
          <p>Back-office operations are private. Enter the operator password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void login();
            }}
            placeholder="Operator password"
          />
          <button className="primary-glass" type="button" onClick={login} disabled={busyAction === "login"}>
            {busyAction === "login" ? <Loader2 size={17} className="spin" /> : <Lock size={17} />}
            Unlock operations
          </button>
          <span>{actionMessage}</span>
        </section>
      </main>
    );
  }

  return (
    <main className="ops-shell">
      <div className="ambient-bg" />
      <div className="grid-noise" />

      <aside className="sidebar">
        <div className="brand-mark" aria-label="Eco AI">
          <Sparkles size={17} />
          <span>Eco AI</span>
        </div>
        <nav className="side-nav" aria-label="Back office navigation">
          {navItems.map((item) => (
            <button className={cx(item === activeNav && "active")} key={item} type="button" onClick={() => setActiveNav(item)}>
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>Production</span>
          <strong>{healthPercent}% health</strong>
        </div>
      </aside>

      <section className="ops-main">
        <header className="ops-topbar">
          <div>
            <span className="section-label">Back office</span>
            <h1>Operations command center</h1>
          </div>
          <div className="top-status">
            <span>{runState}</span>
            <span>{connectedCount}/{totalIntegrations || 10} connected</span>
            <span>{integrationPayload?.model.provider ?? "nousresearch"}</span>
            <button className="logout-button" type="button" onClick={logout} aria-label="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </header>

        <section className="kpi-grid" aria-label="Operations summary">
          <div className="kpi-card">
            <span>Queue</span>
            <strong>{progress}%</strong>
            <em>{selectedStep.title}</em>
          </div>
          <div className="kpi-card">
            <span>Providers</span>
            <strong>{connectedCount}/{totalIntegrations || 10}</strong>
            <em>{healthPercent}% operational</em>
          </div>
          <div className="kpi-card">
            <span>Model</span>
            <strong>{integrationPayload?.model.configured ? "Ready" : "Missing"}</strong>
            <em>{integrationPayload?.model.name ?? "Nemotron Ultra"}</em>
          </div>
          <div className="kpi-card">
            <span>Last event</span>
            <strong>{busyAction ?? "idle"}</strong>
            <em>{actionMessage}</em>
          </div>
        </section>

        <section className="command-grid">
          <div className="glass-panel command-panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">Operator input</span>
                <h2>Command queue</h2>
              </div>
              <TerminalSquare size={18} />
            </div>
            <label htmlFor="goal">Work order</label>
            <textarea id="goal" value={goal} onChange={(event) => setGoal(event.target.value)} />
            <div className="button-row">
              <button className="primary-glass" type="button" onClick={toggleRun} disabled={busyAction !== null}>
                {runState === "running" ? <Pause size={18} /> : <Play size={18} />}
                {runState === "running" ? "Pause queue" : "Run queue"}
              </button>
              <button className="secondary-glass" type="button" onClick={resetPlan}>
                Reset
              </button>
              <button className="secondary-glass" type="button" onClick={refreshIntegrations} disabled={busyAction !== null}>
                {busyAction === "refresh" ? <Loader2 size={18} className="spin" /> : <RefreshCcw size={18} />}
                Refresh providers
              </button>
            </div>
          </div>

          <div className="glass-panel terminal-panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">Model terminal</span>
                <h2>Nous command</h2>
              </div>
              <Brain size={18} />
            </div>
            <div className="model-card">
              <span>Active model</span>
              <strong>{integrationPayload?.model.name ?? "nvidia/nemotron-3-ultra-550b-a55b"}</strong>
            </div>
            <div className="prompt-box">
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Model prompt" />
              <button className="send-button" type="button" onClick={() => testModel()} disabled={busyAction !== null}>
                {busyAction === "model" ? <Loader2 size={17} className="spin" /> : <Send size={17} />}
              </button>
            </div>
          </div>
        </section>

        <section className="work-grid">
          <div className="glass-panel queue-panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">Execution</span>
                <h2>Work queue</h2>
              </div>
              <span className="progress-pill">{progress}%</span>
            </div>
            <div className="queue-table">
              {planSteps.map((step, index) => {
                const Icon = step.icon;
                const status: StepStatus =
                  runState === "complete" || index < activeStep ? "complete" : index === activeStep && runState !== "ready" ? "active" : "pending";
                return (
                  <button
                    className={cx("queue-row", status)}
                    key={step.id}
                    type="button"
                    onClick={() => setSelectedStep(step)}
                  >
                    <span className="row-icon">
                      <Icon size={17} />
                    </span>
                    <strong>{step.title}</strong>
                    <span>{step.owner}</span>
                    <em>{step.description}</em>
                    <b>{status}</b>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">Selected</span>
                <h2>{selectedStep.title}</h2>
              </div>
              <Activity size={18} />
            </div>
            <p className="panel-copy">{selectedStep.description}</p>
            <div className="event-log">
              {eventLines.map((event) => (
                <div key={event.label}>
                  <span>{event.label}</span>
                  <p>{event.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lower-grid">
          <div className="glass-panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">Agents</span>
                <h2>Lane state</h2>
              </div>
              <Network size={18} />
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
                    <em>{agent.lane}</em>
                    <meter min={0} max={100} value={isActive ? 78 : agent.load} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel integrations-panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">Providers</span>
                <h2>Integration health</h2>
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
            </div>
          </div>

          <div className="glass-panel action-panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">Actions</span>
                <h2>Provider controls</h2>
              </div>
              <Zap size={18} />
            </div>
            <button type="button" onClick={startCheckout} disabled={busyAction !== null}>
              <CreditCard size={16} />
              Create Stripe checkout
            </button>
            <button type="button" onClick={testVoice} disabled={busyAction !== null}>
              <Headphones size={16} />
              Test voice route
            </button>
            <button type="button" onClick={() => testModel(`Run an operations check for: ${goal}`)} disabled={busyAction !== null}>
              <Zap size={16} />
              Run model check
            </button>
            <button type="button" onClick={sendInngestEvent} disabled={busyAction !== null}>
              <Activity size={16} />
              Send Inngest event
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
