import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
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
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading">("idle");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const services = [
    {
      icon: Bot,
      title: "Agentic back-office operator",
      body: "An AI operator that handles intake, follows up, updates systems, triggers workflows, and escalates the right work.",
    },
    {
      icon: Workflow,
      title: "Workflow and CRM execution",
      body: "Clay enrichment, Firecrawl research, data entry, lead routing, approvals, storage, jobs, and provider health in one flow.",
    },
    {
      icon: Mic2,
      title: "Inbound and outbound voice agents",
      body: "Voice agents that answer, qualify, schedule, recover missed opportunities, and hand off hot conversations.",
    },
    {
      icon: Database,
      title: "Enterprise-grade data layer",
      body: "Postgres, Supabase, NileDB, blob storage, video, auth, email, and auditability wired for production operations.",
    },
  ];
  const outcomes = [
    "Missed call and lead recovery",
    "Inbound and outbound voice agent flows",
    "CRM enrichment and follow-up automation",
    "Back-office workflow map and build plan",
  ];

  useEffect(() => {
    fetch("/api/integrations/mux-playback")
      .then((response) => response.json())
      .then((data) => setPlaybackId(data.playbackId || ""))
      .catch(() => setPlaybackId(""));
  }, []);

  const startCheckout = async () => {
    setCheckoutState("loading");
    setCheckoutMessage("");
    try {
      const response = await fetch("/api/integrations/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer: "blueprint" }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.detail || data.error || "Stripe checkout failed");
      window.location.href = data.url;
    } catch (error) {
      setCheckoutMessage(error instanceof Error ? error.message : "Stripe checkout failed.");
      setCheckoutState("idle");
    }
  };

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
          <h1>Turn missed calls, inbox chaos, and manual follow-up into an AI-run back office.</h1>
          <p>
            Eco AI installs agentic operators that answer, qualify, enrich, update your CRM, send the
            follow-up, trigger the workflow, and hand off the money conversations to your team.
          </p>
          <div className="landing-actions">
            <button className="primary-glass" type="button" onClick={startCheckout} disabled={checkoutState === "loading"}>
              <CreditCard size={17} />
              {checkoutState === "loading" ? "Opening checkout" : "Start AI Ops Blueprint - $497"}
            </button>
            <a className="secondary-glass" href="#video">
              <Play size={17} />
              Play video
            </a>
          </div>
          {checkoutMessage ? <p className="checkout-message">{checkoutMessage}</p> : null}
          <div className="offer-list" aria-label="Blueprint outcomes">
            {outcomes.map((outcome) => (
              <span key={outcome}>
                <CheckCircle2 size={15} />
                {outcome}
              </span>
            ))}
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

      <section className="offer-band" aria-label="Eco AI offer">
        <div>
          <span className="section-label">What you are buying</span>
          <h2>A working plan for an AI operations layer, then a path to build it.</h2>
        </div>
        <p>
          The $497 blueprint is the paid front door: we map your intake, follow-up, voice, CRM,
          data, and automation gaps, then scope the agentic workflows that should be built first.
          The goal is simple: fewer dropped leads, faster response, cleaner systems, and more work
          handled without adding headcount.
        </p>
      </section>

      <section className="landing-services" aria-label="Eco AI capabilities">
        <div className="services-copy">
          <h2>Built for operators, not software tourists.</h2>
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
