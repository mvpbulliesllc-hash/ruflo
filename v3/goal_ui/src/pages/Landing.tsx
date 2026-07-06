import React, { useEffect, useState } from "react";
import { ArrowRight, Bot, Database, Lock, Mail, Mic2, Play, Sparkles, Workflow } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  const [playbackId, setPlaybackId] = useState("");
  const services = [
    {
      icon: Bot,
      title: "Agentic operators",
      body: "AI agents that reason through tasks, call tools, update systems, and report what changed.",
    },
    {
      icon: Workflow,
      title: "Workflow automation",
      body: "Event-driven operations across CRM, enrichment, email, storage, databases, queues, and internal approvals.",
    },
    {
      icon: Mic2,
      title: "Inbound and outbound voice",
      body: "Voice agents for intake, qualification, follow-up, scheduling, handoffs, and customer support.",
    },
    {
      icon: Database,
      title: "Enterprise data layer",
      body: "Connected Postgres, Supabase, NileDB, file storage, video, and integration health for production operations.",
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
          <h1>Enterprise-grade AI automation for real back-office work.</h1>
          <p>
            Eco AI builds agentic systems that run workflows, manage data, operate voice channels,
            trigger jobs, enrich leads, route messages, and keep the business moving from one private
            operations console.
          </p>
          <div className="landing-actions">
            <Link className="primary-glass" to="/ops">
              <Lock size={17} />
              Operator login
            </Link>
            <a className="secondary-glass" href="#video">
              <Play size={17} />
              Play video
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

      <section className="landing-services" aria-label="Eco AI capabilities">
        <div className="services-copy">
          <h2>Built for operators, not demo decks.</h2>
          <p>
            Agentic agents, workflow orchestration, inbound and outbound voice, agent mail, Clay
            enrichment, Firecrawl research, Mux video, storage, auth, and production database wiring
            are treated as one operating system.
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

      <section className="landing-strip">
        {[
          "Agentic agents",
          "Workflow automation",
          "Inbound voice",
          "Outbound voice",
          "Clay enrichment",
          "Firecrawl research",
          "Mux video",
          "Three databases",
          "Storage",
          "Agent mail",
          "Private ops auth",
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
