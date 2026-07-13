# Improvement roadmap

Statuses: `DONE`, `IN PROGRESS`, `NEXT`, `BLOCKED`, `LATER`.

| Status | Item | Completion check |
|---|---|---|
| DONE | HTML, accessibility and interaction audit | Static guards and component syntax checks pass |
| DONE | Central campaign content module | Runtime lists and editor overrides map through `site-content.js` |
| DONE | Reusable verification command | `node .\scripts\verify-site.mjs` passes |
| DONE | Rendered DOM and computed-style smoke test | `.\scripts\check-render.ps1` passes in Microsoft Edge |
| DONE | Semantic site version | Version agrees across `VERSION`, HTML, runtime data and theme metadata |
| DONE | Extract shared shell CSS | `site.css` loads before the component renders |
| DONE | Reproducible WordPress build and publish workflow | Theme directory and ZIP are synchronized and documented |
| DONE | Extract repeated inline component styles | Structural, CSS and keyboard-related markup checks pass |
| DONE | Split major sections into importable components | Header, content sections and footer are independently importable; anchors, bindings and modal behavior remain unchanged |
| DONE | Responsive mobile navigation | Keyboard, touch-size, Escape handling and reduced-motion checks pass |
| DONE | Responsive local image build pipeline | Pinned fixture test generates and verifies AVIF, WebP and JPEG variants; production originals remain a publishing input |
| DONE | Publish approved local imagery | Repository artwork generates responsive hero and social-sharing variants and is packaged with WordPress |
| DONE | Provider-ready notification client | Disabled configuration sends no data; configured mode requires HTTPS, consent, timeout handling and accessible status feedback |
| DONE | Email subscription contact path | Contact and subscription requests use `support@photographerthemovie.com` until an automated provider is approved |
| BLOCKED | Activate notification subscription | Requires an HTTPS provider endpoint, reviewed privacy URL/consent copy and provider-side double opt-in, security and rate limits |
| DONE | Structured editorial workflow | JSON source, editor schema, deterministic generator and stale-output checks are documented and automated |
| DONE | Automated browser accessibility and Lighthouse checks | Rendered accessibility guards and Lighthouse run locally and in CI |

Update this table in the same commit whenever an item changes status.
