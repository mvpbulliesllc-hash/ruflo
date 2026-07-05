# ECO MATRIX — Master Build

The mission: ship the best roofing site on the internet for Paragon Exteriors, ship the ECO MATRIX agency site that sells it, and stand up the lead-gen platform behind it.

## Current State

- Paragon flagship is live at www.paragonexteriorsnj.com (Astro on Vercel, ~150 pages).
- ECO MATRIX agency site copy v2 written, needs building.
- 100 demo sites verified launch-ready.
- Lead-gen platform specced, not yet built.

## Build Queue

### Phase 1 — Paragon flagship: fix + upgrade

Fix and upgrade the live client build.

- **P1.1 Images:** move content images from public/ to src/assets/, convert to Picture AVIF+WebP with responsive srcset, width/height on every image, eager+preload the LCP hero, lazy the rest.
- **P1.2 Quick fixes:** resolve /sitemap.xml 404, add lastmod + image sitemap entries, font-display swap.
- **P1.3 Schema completeness:** Organization/LocalBusiness sameAs, AggregateRating + Review (guarded), WebSite + SearchAction, Service on all service pages.
- **P1.4 Reviews + GBP wiring:** review component + schema, embedded map, sitewide NAP block.
- **P1.5 Geo saturation:** expand 39 to every municipality in Ocean + Monmouth, add storm-damage x town. Keep each page genuinely unique.
- **P1.6 Internal mesh + breadcrumbs, per-page dynamic OG images.**
- **P1.7 CWV budget:** Lighthouse mobile Perf >=95, LCP <2.0s, CLS <0.1, INP <200ms.

### Phase 2 — ECO MATRIX agency site

Revenue engine.

- **P2.1 Template marketplace:** /templates gallery, config-driven, 5 live demos deployed, CTA to lead form to CRM.
- **P2.2 Explainer pages:** build the SEO / GEO / schema explainer pages.
- **P2.3 Site copy v2:** implement the hero, headline, founding-ten ladder, calculator, FAQ, meta.

### Phase 3 — Lead-gen platform

Bigger build, separate track.

- **P3.1 Compliance spine:** DNC scrub, consent ledger, opt-out handler, 10DLC as first-class features.
- **P3.2 Satellite roof-scan pipeline:** imagery enrichment and property data enrichment.
- **P3.3 Outreach engine:** Twilio + Hume EVI + Daily.co, single-tenant Paragon MVP first.

## Global Standards

- The deliverable is the finished, tested, documented thing, not a plan.
- Verify with evidence, not confidence. Run Lighthouse, validate schema, run a link checker.
- Never fabricate: no fake reviews/ratings in schema, no faked data.
- Do not break the ~150-page architecture, existing URLs (301 any changes), existing schema.

## Verification Gates

- Phase 1 done when Lighthouse targets hit on homepage + a service page + a town page; schema validates clean; /sitemap.xml resolves 200; zero broken links; CLS <0.1.
- Phase 2 done when marketplace gallery renders from config, 5 demos live, CTA creates a CRM lead; explainer pages live.
- Phase 3 done when single-tenant Paragon MVP runs the full pipeline with the compliance spine, tested, documented.

## Needs Jarad

- Google Business Profile URL + social profile URLs.
- Confirmation of Paragon service radius for the geo expansion.
- The 5 chosen Vercel templates for the marketplace (+ license check).
- API keys for the lead-gen platform (imagery, property data, Twilio, Hume) and CRM sending accounts.
