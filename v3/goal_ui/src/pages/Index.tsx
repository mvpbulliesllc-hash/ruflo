import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Apple,
  Bot,
  Brain,
  Check,
  ChevronRight,
  Circle,
  Clock,
  Command,
  Database,
  GitBranch,
  HardDrive,
  Layers3,
  MemoryStick,
  Network,
  Pause,
  Play,
  Radar,
  RefreshCcw,
  Route,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { GOAPPlanner, parseGoal, type Step } from "@/lib/goapPlanner";

type RunState = "ready" | "planning" | "running" | "complete" | "paused";
type AgentState = "ready" | "active" | "done";

type Agent = {
  id: string;
  name: string;
  role: string;
  state: AgentState;
  load: number;
};

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

const initialGoal =
  "Launch Eco AI as a production agent planning console on ecoaisolutions.com";

const agents: Agent[] = [
  { id: "planner", name: "Planner", role: "A* goal decomposition", state: "ready", load: 18 },
  { id: "research", name: "Research", role: "Context and source scan", state: "ready", load: 11 },
  { id: "builder", name: "Builder", role: "Implementation swarm", state: "ready", load: 22 },
  { id: "reviewer", name: "Reviewer", role: "Quality and safety gates", state: "ready", load: 8 },
  { id: "ops", name: "Ops", role: "Deploy and observe", state: "ready", load: 14 },
];

const planActions = [
  {
    name: "analyzeGoal",
    cost: 1,
    preconditions: { goalDefined: true },
    effects: { goalParsed: true },
    stepGenerator: (goal: string): Step => ({
      id: "1",
      title: "Goal analysis",
      description: `Parse "${goal}" into constraints, success criteria, and action lanes.`,
      icon: Search,
      status: "pending",
      data: [
        { text: "Extract required outcome", icon: Command },
        { text: "Identify dependencies and risk", icon: ShieldCheck },
        { text: "Create state transition map", icon: Route },
      ],
      metrics: [
        { label: "cost", value: "1" },
        { label: "confidence", value: "97%" },
      ],
    }),
  },
  {
    name: "assessState",
    cost: 2,
    preconditions: { goalParsed: true },
    effects: { stateAssessed: true },
    stepGenerator: (): Step => ({
      id: "2",
      title: "Workspace assessment",
      description: "Inspect repo state, deploy surface, scripts, and provider constraints.",
      icon: Radar,
      status: "pending",
      data: [
        { text: "Read package scripts", icon: TerminalSquare },
        { text: "Select Vercel-ready app root", icon: Layers3 },
        { text: "Check build output", icon: Check },
      ],
      metrics: [
        { label: "agents", value: "3" },
        { label: "risk", value: "low" },
      ],
    }),
  },
  {
    name: "gatherInformation",
    cost: 2,
    preconditions: { stateAssessed: true },
    effects: { informationGathered: true },
    stepGenerator: (): Step => ({
      id: "3",
      title: "Context retrieval",
      description: "Pull reusable docs, plugin metadata, agent roles, and memory graph hints.",
      icon: Database,
      status: "pending",
      data: [
        { text: "Index goal and agent capabilities", icon: Brain },
        { text: "Attach memory namespace", icon: MemoryStick },
        { text: "Rank relevant tools", icon: Network },
      ],
      metrics: [
        { label: "records", value: "128" },
        { label: "latency", value: "41ms" },
      ],
    }),
  },
  {
    name: "analyzeDocuments",
    cost: 3,
    preconditions: { informationGathered: true },
    effects: { documentsAnalyzed: true },
    stepGenerator: (): Step => ({
      id: "4",
      title: "Plan synthesis",
      description: "Build the shortest executable route and assign owners to each branch.",
      icon: GitBranch,
      status: "pending",
      data: [
        { text: "Run A* plan search", icon: Route },
        { text: "Split parallel branches", icon: Network },
        { text: "Set review checkpoints", icon: ShieldCheck },
      ],
      metrics: [
        { label: "branches", value: "5" },
        { label: "parallel", value: "on" },
      ],
    }),
  },
  {
    name: "generateInsights",
    cost: 2,
    preconditions: { documentsAnalyzed: true },
    effects: { knowledgeSynthesized: true, insightsGenerated: true },
    stepGenerator: (): Step => ({
      id: "5",
      title: "Execution",
      description: "Run assigned agents, stream activity, and update progress from local state.",
      icon: Zap,
      status: "pending",
      data: [
        { text: "Start execution loop", icon: Play },
        { text: "Record tool outcomes", icon: Activity },
        { text: "Persist learned pattern", icon: Brain },
      ],
      metrics: [
        { label: "runtime", value: "live" },
        { label: "workers", value: "5" },
      ],
    }),
  },
  {
    name: "verifyResults",
    cost: 1,
    preconditions: { insightsGenerated: true },
    effects: { verified: true },
    stepGenerator: (): Step => ({
      id: "6",
      title: "Verification",
      description: "Run checks, confirm deployment readiness, and surface any blockers.",
      icon: ShieldCheck,
      status: "pending",
      data: [
        { text: "Build and route checks", icon: Check },
        { text: "Deployment handoff", icon: HardDrive },
        { text: "Operator summary", icon: Sparkles },
      ],
      metrics: [
        { label: "gates", value: "passed" },
        { label: "status", value: "ready" },
      ],
    }),
  },
];

const worldState = {
  goalDefined: true,
  goalParsed: false,
  stateAssessed: false,
  informationGathered: false,
  documentsAnalyzed: false,
  knowledgeSynthesized: false,
  insightsGenerated: false,
  verified: false,
};

const goalState = {
  goalDefined: true,
  goalParsed: true,
  stateAssessed: true,
  informationGathered: true,
  documentsAnalyzed: true,
  knowledgeSynthesized: true,
  insightsGenerated: true,
  verified: true,
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function Index() {
  const [goal, setGoal] = useState(initialGoal);
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [runState, setRunState] = useState<RunState>("ready");
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [integrationPayload, setIntegrationPayload] = useState<IntegrationPayload | null>(null);
  const [integrationBusy, setIntegrationBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("Server integrations are ready to check.");
  const parsedGoal = useMemo(() => parseGoal(goal), [goal]);
  const connectedCount = integrationPayload?.integrations.filter((item) => item.ok).length ?? 0;

  const progress =
    steps.length === 0
      ? 0
      : Math.round((steps.filter((step) => step.status === "completed").length / steps.length) * 100);

  const runPlan = () => {
    const planner = new GOAPPlanner(planActions);
    const plannedSteps = planner.plan(worldState, goalState, goal);
    setSteps(plannedSteps.map((step, index) => ({ ...step, status: index === 0 ? "active" : "pending" })));
    setSelectedStep(plannedSteps[0] ?? null);
    setActiveIndex(0);
    setRunState("running");
  };

  const resetPlan = () => {
    setSteps([]);
    setActiveIndex(-1);
    setSelectedStep(null);
    setRunState("ready");
  };

  const toggleRun = () => {
    if (runState === "ready" || steps.length === 0) {
      runPlan();
      return;
    }
    setRunState((current) => (current === "running" ? "paused" : "running"));
  };

  const refreshIntegrations = async () => {
    setIntegrationBusy(true);
    try {
      const response = await fetch("/api/integrations/status");
      const data = (await response.json()) as IntegrationPayload;
      setIntegrationPayload(data);
      setActionMessage(response.ok ? "Integration status refreshed." : "Status check returned an error.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Integration status failed.");
    } finally {
      setIntegrationBusy(false);
    }
  };

  const startCheckout = async () => {
    setIntegrationBusy(true);
    try {
      const response = await fetch("/api/integrations/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 2500, label: "Eco AI strategy session" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || "Stripe checkout failed");
      window.open(data.url, "_blank", "noopener,noreferrer");
      setActionMessage(`Stripe checkout created in ${data.mode} mode.`);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Stripe checkout failed.");
    } finally {
      setIntegrationBusy(false);
    }
  };

  const testVoice = async () => {
    setIntegrationBusy(true);
    try {
      const response = await fetch("/api/integrations/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Eco AI integrations are online and ready." }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || "Voice generation failed");
      const audio = new Audio(data.audio);
      await audio.play();
      setActionMessage("ElevenLabs voice generated and playing.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Voice generation failed.");
    } finally {
      setIntegrationBusy(false);
    }
  };

  const testModel = async () => {
    setIntegrationBusy(true);
    try {
      const response = await fetch("/api/integrations/nous-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Reply in one short sentence that Eco AI model routing is online.", maxTokens: 48 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || "Model call failed");
      setActionMessage(data.content || "Nous model call completed.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Model call failed.");
    } finally {
      setIntegrationBusy(false);
    }
  };

  useEffect(() => {
    void refreshIntegrations();
  }, []);

  useEffect(() => {
    if (runState !== "running" || steps.length === 0 || activeIndex < 0) return;

    const timer = window.setTimeout(() => {
      setSteps((current) => {
        const next = current.map((step, index) => {
          if (index < activeIndex) return { ...step, status: "completed" as const };
          if (index === activeIndex) return { ...step, status: "completed" as const };
          if (index === activeIndex + 1) return { ...step, status: "active" as const };
          return { ...step, status: "pending" as const };
        });
        setSelectedStep(next[Math.min(activeIndex + 1, next.length - 1)] ?? null);
        return next;
      });

      if (activeIndex >= steps.length - 1) {
        setRunState("complete");
      } else {
        setActiveIndex((index) => index + 1);
      }
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [activeIndex, runState, steps.length]);

  const liveAgents = agents.map((agent, index) => {
    if (runState === "complete") return { ...agent, state: "done" as const, load: 0 };
    if (runState === "running" && index === activeIndex % agents.length) {
      return { ...agent, state: "active" as const, load: Math.min(96, agent.load + 52) };
    }
    if (runState === "running" && index < activeIndex) return { ...agent, state: "done" as const, load: 12 };
    return agent;
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="Eco AI home">
          <span className="brand-mark">
            <Apple size={17} />
          </span>
          <span>Eco AI</span>
        </Link>

        <nav className="nav-stack" aria-label="Primary">
          <Link className="nav-item active" to="/">
            <Command size={17} />
            <span>Goal Planner</span>
          </Link>
          <Link className="nav-item" to="/agents">
            <Bot size={17} />
            <span>Agents</span>
          </Link>
          <Link className="nav-item" to="/demo">
            <Layers3 size={17} />
            <span>Widget</span>
          </Link>
          <button className="nav-item" type="button">
            <Database size={17} />
            <span>Memory</span>
          </button>
          <button className="nav-item" type="button" onClick={refreshIntegrations}>
            <Zap size={17} />
            <span>Integrations</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="mini-status">
            <span className="pulse" />
            <div>
              <strong>Ready</strong>
              <span>Vercel build target</span>
            </div>
          </div>
          <button className="icon-button" type="button" aria-label="Settings">
            <Settings2 size={16} />
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="overline">Eco AI</p>
            <h1>Autonomous work, wired into one clear console.</h1>
          </div>
          <div className="topbar-actions">
            <div className="segmented" aria-label="Execution mode">
              <button type="button" className="selected">Auto</button>
              <button type="button">Review</button>
            </div>
            <button className="icon-button" type="button" onClick={resetPlan} aria-label="Reset plan">
              <RefreshCcw size={16} />
            </button>
          </div>
        </header>

        <section className="composer-panel">
          <div className="composer-copy">
            <label htmlFor="goal-input">Describe the outcome you want</label>
            <textarea
              id="goal-input"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={3}
            />
            <div className="goal-meta">
              <span>{parsedGoal.domain}</span>
              <span>{parsedGoal.action}</span>
              {parsedGoal.keywords.slice(0, 3).map((keyword) => (
                <span key={keyword}>{keyword}</span>
              ))}
            </div>
          </div>
          <div className="composer-actions">
            <button className="primary-button" type="button" onClick={toggleRun}>
              {runState === "running" ? <Pause size={17} /> : <Play size={17} />}
              <span>{runState === "running" ? "Pause" : "Run plan"}</span>
            </button>
            <div className="progress-ring" aria-label={`Execution ${progress}% complete`}>
              <span>{progress}%</span>
            </div>
          </div>
        </section>

        <div className="content-grid">
          <section className="main-panel">
            <div className="panel-heading">
              <div>
                <p className="overline">Execution</p>
                <h2>Plan timeline</h2>
              </div>
              <span className={classNames("state-pill", runState)}>{runState}</span>
            </div>

            <div className="timeline">
              {(steps.length ? steps : planActions.map((action) => action.stepGenerator(goal))).map(
                (step, index) => {
                  const Icon = step.icon;
                  const status = steps[index]?.status ?? "pending";
                  return (
                    <button
                      type="button"
                      className={classNames("timeline-row", status, selectedStep?.id === step.id && "selected")}
                      key={step.id}
                      onClick={() => setSelectedStep(steps[index] ?? step)}
                    >
                      <span className="timeline-node">
                        {status === "completed" ? <Check size={14} /> : <Icon size={16} />}
                      </span>
                      <span className="timeline-copy">
                        <strong>{step.title}</strong>
                        <span>{step.description}</span>
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  );
                }
              )}
            </div>
          </section>

          <aside className="inspector">
            <section className="inspector-panel">
              <div className="panel-heading">
                <div>
                  <p className="overline">Live agents</p>
                  <h2>Swarm state</h2>
                </div>
                <Activity size={17} />
              </div>
              <div className="agent-list">
                {liveAgents.map((agent) => (
                  <div className="agent-row" key={agent.id}>
                    <span className={classNames("agent-dot", agent.state)} />
                    <div>
                      <strong>{agent.name}</strong>
                      <span>{agent.role}</span>
                    </div>
                    <meter min={0} max={100} value={agent.load} />
                  </div>
                ))}
              </div>
            </section>

            <section className="inspector-panel">
              <div className="panel-heading">
                <div>
                  <p className="overline">Integrations</p>
                  <h2>{connectedCount} connected</h2>
                </div>
                <button className="icon-button compact" type="button" onClick={refreshIntegrations} aria-label="Refresh integrations">
                  <RefreshCcw size={15} />
                </button>
              </div>
              <div className="integration-list">
                {(integrationPayload?.integrations ?? []).map((item) => (
                  <div className="integration-row" key={item.id}>
                    <span className={classNames("agent-dot", item.ok ? "done" : item.configured ? "active" : "ready")} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.message}</span>
                    </div>
                    <em>{item.mode}</em>
                  </div>
                ))}
                {!integrationPayload && (
                  <div className="detail-item">
                    <Zap size={16} />
                    <span>{integrationBusy ? "Checking integrations..." : "Integration status not loaded."}</span>
                  </div>
                )}
              </div>
              <div className="integration-actions">
                <button className="tiny-button" type="button" onClick={startCheckout} disabled={integrationBusy}>
                  Stripe checkout
                </button>
                <button className="tiny-button" type="button" onClick={testVoice} disabled={integrationBusy}>
                  Voice test
                </button>
                <button className="tiny-button span-two" type="button" onClick={testModel} disabled={integrationBusy}>
                  Model test
                </button>
              </div>
            </section>

            <section className="inspector-panel">
              <div className="panel-heading">
                <div>
                  <p className="overline">Memory graph</p>
                  <h2>Context links</h2>
                </div>
                <Network size={17} />
              </div>
              <div className="memory-map compact-map">
                {["stripe", "github", "attio", "nous", "composio"].map((node, index) => (
                  <span key={node} style={{ "--node-index": index } as React.CSSProperties}>
                    {node}
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>

      <aside className="detail-rail">
        <div className="detail-header">
          <p className="overline">Selected step</p>
          <h2>{selectedStep?.title ?? "Ready"}</h2>
          <p>{selectedStep?.description ?? "Run a plan to inspect execution details and tool output."}</p>
        </div>

        <div className="detail-stack">
          {(selectedStep?.data ?? [
            { text: "Local GOAP planner loaded", icon: Brain },
            { text: "Vercel SPA routing configured", icon: HardDrive },
            { text: "Interactive state ready", icon: Circle },
          ]).map((item) => {
            const Icon = item.icon ?? Circle;
            return (
              <div className="detail-item" key={item.text}>
                <Icon size={16} />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>

        <div className="metric-grid">
          {(selectedStep?.metrics ?? [
            { label: "status", value: "ready" },
            { label: "integrations", value: String(connectedCount) },
            { label: "model", value: integrationPayload?.model.name ?? "claude-sonnet" },
            { label: "model key", value: integrationPayload?.model.configured ? "ready" : "missing" },
          ]).map((metric) => (
            <div className="metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>

        <div className="activity-log">
          <div className="panel-heading">
            <h2>Event stream</h2>
            <Clock size={15} />
          </div>
          {[
            "Planner synchronized with current goal",
            actionMessage,
            runState === "complete" ? "Verification gates passed" : "Awaiting next transition",
          ].map((event) => (
            <div className="log-row" key={event}>
              <span />
              <p>{event}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
