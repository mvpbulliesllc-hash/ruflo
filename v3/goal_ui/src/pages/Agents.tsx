import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  Check,
  Code2,
  FileCheck2,
  GitBranch,
  Pause,
  Play,
  ServerCog,
  TestTube2,
} from "lucide-react";

const rows = [
  { name: "Revenue", icon: GitBranch, lane: "Qualify leads and book calls" },
  { name: "Support", icon: Bot, lane: "Resolve questions across channels" },
  { name: "Operations", icon: ServerCog, lane: "Update systems and trigger follow-through" },
  { name: "Research", icon: FileCheck2, lane: "Enrich accounts and surface context" },
  { name: "Voice", icon: TestTube2, lane: "Handle inbound and outbound conversations" },
  { name: "Build", icon: Code2, lane: "Create content, campaigns, and automations" },
];

export default function Agents() {
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setTick((value) => (value + 1) % rows.length), 900);
    return () => window.clearInterval(timer);
  }, [running]);

  return (
    <div className="page-shell">
      <header className="simple-topbar">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Back
        </Link>
        <button className="primary-button" type="button" onClick={() => setRunning((value) => !value)}>
          {running ? <Pause size={17} /> : <Play size={17} />}
          {running ? "Pause swarm" : "Start swarm"}
        </button>
      </header>

      <main className="agents-page">
        <section className="page-title">
          <span className="brand-mark">
            <Bot size={18} />
          </span>
          <div>
            <p className="overline">Agents</p>
            <h1>Live workforce lanes</h1>
          </div>
        </section>

        <div className="agent-board">
          {rows.map((row, index) => {
            const Icon = row.icon;
            const active = running && tick === index;
            const complete = running && index < tick;
            return (
              <article className={active ? "agent-card active" : "agent-card"} key={row.name}>
                <div className="agent-card-icon">{complete ? <Check size={19} /> : <Icon size={19} />}</div>
                <div>
                  <h2>{row.name}</h2>
                  <p>{row.lane}</p>
                </div>
                <span>{active ? "active" : complete ? "done" : "ready"}</span>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
