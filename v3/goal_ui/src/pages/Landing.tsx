import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Database,
  Lock,
  Mic2,
  Play,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  const [playbackId, setPlaybackId] = useState("");
  const services = [
    {
      icon: Bot,
      title: "Revenue agents",
      body: "Answer every lead in seconds, qualify, follow up, and book so nothing leaks.",
    },
    {
      icon: Mic2,
      title: "Support agents",
      body: "Resolve calls, chats, and tickets with no queue and no hold music.",
    },
    {
      icon: Database,
      title: "Operations agents",
      body: "Run the back office: data, scheduling, follow-through, reporting, and handoffs.",
    },
    {
      icon: Workflow,
      title: "Build agents",
      body: "Ship code, content, automations, and campaigns on demand.",
    },
  ];

  useEffect(() => {
    fetch("/api/integrations/mux-playback")
      .then((response) => response.json())
      .then((data) => setPlaybackId(data.playbackId || ""))
      .catch(() => setPlaybackId(""));
  }, []);

  return (
    <main className="landing-shell">
      <div className="ambient-bg" />
      <div className="grid-noise" />
      <header className="landing-header">
        <div className="brand-mark" aria-label="Eco AI">
          <Sparkles size={17} />
          <span>Eco AI</span>
        </div>
        <Link className="ops-link" to="/ops">
          <Lock size={15} />
          Back office
        </Link>
      </header>

      <section className="landing-stage">
        <div className="landing-copy">
          <span className="section-label">Eco AI Solutions</span>
          <h1>Your next hire isn't a person. It's a workforce.</h1>
          <p>
            Eco AI Solutions deploys autonomous AI agent teams that run your sales, support, and
            operations around the clock, in your voice, wired into your tools, at a fraction of the
            cost of a single employee.
          </p>
          <div className="landing-actions">
            <a
              className="primary-glass"
              href="mailto:j@ecoaisolutions.com?subject=Eco%20AI%20deployment%20call"
            >
              <BriefcaseBusiness size={17} />
              Book a deployment call
            </a>
            <a className="secondary-glass" href="#video">
              <Play size={17} />
              See it run live
            </a>
          </div>
        </div>

        <div className="landing-video" id="video">
          {playbackId ? (
            React.createElement("mux-player", {
              "playback-id": playbackId,
              controls: true,
              "stream-type": "on-demand",
              style: { display: "block", width: "100%", aspectRatio: "16 / 9", background: "#000" },
            })
          ) : (
            <div className="video-pending">
              <Play size={28} />
              <span>Mux video is being prepared</span>
            </div>
          )}
          <div className="video-caption">
            <span>Eco AI media</span>
            <strong>Sound enabled through player controls</strong>
          </div>
        </div>
      </section>

      <section className="offer-band" aria-label="The problem">
        <div>
          <span className="section-label">The problem</span>
          <h2>Headcount doesn't scale. The work does.</h2>
        </div>
        <p>
          Every growing company hits the same wall. The work outpaces the team. You hire, you train,
          you wait months, and the backlog still wins. Leads go cold before anyone answers. Tickets
          stack up. The back office quietly eats your margin. Adding people is slow, expensive, and
          it caps out, and the best ones still leave.
        </p>
      </section>

      <section className="offer-band" aria-label="The shift">
        <div>
          <span className="section-label">The shift</span>
          <h2>We deploy the team instead of making you hire it.</h2>
        </div>
        <p>
          Eco AI builds and runs an autonomous agent workforce inside your business. Not a chatbot.
          A coordinated team of specialized AI agents that answer, sell, support, research, and
          execute, 24/7, in your brand's voice, connected to the systems you already use. They go to
          work the day you turn them on. No ramp. No turnover. No ceiling.
        </p>
      </section>

      <section className="landing-services" aria-label="Eco AI capabilities">
        <div className="services-copy">
          <span className="section-label">What they do</span>
          <h2>Each one specialized. All of them coordinated.</h2>
          <p>
            One workforce, every channel, always on. Your agents answer, sell, support, research,
            operate, and build without adding another seat to payroll.
          </p>
        </div>
        <div className="service-grid">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <article className="service-card" key={service.title}>
                <Icon size={21} />
                <h3>{service.title}</h3>
                <p>{service.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="offer-band" aria-label="The engine">
        <div>
          <span className="section-label">The engine</span>
          <h2>Behind it: a coordinated swarm of 60+ agents.</h2>
        </div>
        <p>
          Most AI solutions are a single model behind a prompt. Ours is an orchestrated swarm of
          specialized agents with shared memory, smart routing, and self-correction, the architecture
          used to run autonomous engineering teams. That's why it doesn't just respond. It executes,
          verifies its own work, and gets sharper every day it runs. The result is a system that
          operates like a department, not a feature.
        </p>
      </section>

      <section className="offer-band" aria-label="The outcome">
        <div>
          <span className="section-label">The outcome</span>
          <h2>One workforce. The output of a team. Less than one salary.</h2>
        </div>
        <p>
          No turnover. No ramp. No sick days. No overtime. No ceiling. Deployed in weeks, not
          quarters, and running the moment it's live. The work still gets done. It just stops
          depending on how many people you can find, afford, and keep.
        </p>
      </section>

      <section className="proof-section" aria-label="Proof">
        <span className="section-label">Proof</span>
        <h2>Verified deployment results will live here.</h2>
        <p>
          Case results are published only when they are real, measured, and tied to deployed systems.
          As deployments go live, this section will show the workflow, what was automated, and the
          operational result without inflated claims.
        </p>
      </section>

      <section className="final-offer" aria-label="The offer">
        <span className="section-label">The offer</span>
        <h2>See it running in your business before you commit a dollar.</h2>
        <p>
          We map one workflow, deploy a live agent on it, and show you the result. You watch it work
          on your own operation first. Then you decide.
        </p>
        <a className="primary-glass" href="mailto:j@ecoaisolutions.com?subject=Eco%20AI%20deployment%20call">
          <BriefcaseBusiness size={17} />
          Book a deployment call
        </a>
      </section>

      <section className="landing-strip">
        {[
          "Revenue agents",
          "Support agents",
          "Operations agents",
          "Build agents",
          "60+ agent swarm",
          "Shared memory",
          "Smart routing",
          "Self-correction",
          "Your voice",
          "Your tools",
        ].map((item) => (
          <span key={item}>
            {item}
            <ArrowRight size={14} />
          </span>
        ))}
      </section>
    </main>
  );
}
