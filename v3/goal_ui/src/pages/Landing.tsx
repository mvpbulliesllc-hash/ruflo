import React, { useEffect, useState } from "react";
import { ArrowRight, Lock, Play, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  const [playbackId, setPlaybackId] = useState("");

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
          <h1>Operational AI for the work behind the work.</h1>
          <p>
            A public front door for Eco AI, backed by a private operations console for agents, jobs,
            provider health, video, storage, data, and execution.
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
            <span>Landing media</span>
            <strong>Sound enabled through player controls</strong>
          </div>
        </div>
      </section>

      <section className="landing-strip">
        {["Inngest jobs", "Mux video", "Clay workflows", "Three data stores", "Private ops auth"].map((item) => (
          <span key={item}>
            {item}
            <ArrowRight size={14} />
          </span>
        ))}
      </section>
    </main>
  );
}
