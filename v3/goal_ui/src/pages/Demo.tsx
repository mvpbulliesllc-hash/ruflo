import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Copy, Layers3 } from "lucide-react";

export default function Demo() {
  const [copied, setCopied] = useState(false);
  const embed = `<div id="eco-ai-widget-container"></div>
<script src="${window.location.origin}/widget.js"></script>
<link rel="stylesheet" href="${window.location.origin}/widget.css" />`;

  const copy = async () => {
    await navigator.clipboard.writeText(embed);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="page-shell">
      <header className="simple-topbar">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Back
        </Link>
      </header>
      <main className="demo-page">
        <section className="page-title">
          <span className="brand-mark">
            <Layers3 size={18} />
          </span>
          <div>
            <p className="overline">Deployment</p>
            <h1>Embed an AI workforce front door anywhere</h1>
          </div>
        </section>
        <div className="code-panel">
          <button className="icon-button" type="button" onClick={copy} aria-label="Copy embed code">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <pre>{embed}</pre>
        </div>
        <section className="widget-preview">
          <h2>Preview</h2>
          <p>Drop the script on a site and Eco AI can greet visitors, collect intent, and route the work to the right agent team.</p>
          <div className="preview-card">
            <strong>Eco AI workforce intake</strong>
            <span>Ready for enterprise pages</span>
          </div>
        </section>
      </main>
    </div>
  );
}
