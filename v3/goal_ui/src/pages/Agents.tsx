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
  Shield,
  TestTube2,
} from "lucide-react";

const rows = [
  { name: "Architecture", icon: GitBranch, lane: "Plan topology and boundaries" },
  { name: "Implementation", icon: Code2, lane: "Apply code changes" },
  { name: "Testing", icon: TestTube2, lane: "Run build and smoke checks" },
  { name: "Review", icon: FileCheck2, lane: "Inspect regressions" },
  { name: "Security", icon: Shield, lane: "Policy and secret scan" },
  { name: "Deploy", icon: ServerCog, lane: "Ship to Vercel" },
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
            <h1>Live execution lanes</h1>
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
