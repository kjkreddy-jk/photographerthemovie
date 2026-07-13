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
| BLOCKED | Responsive local image pipeline | Requires approved local poster, still and portrait source files before variants can be generated |
| BLOCKED | Real notification subscription | Requires provider choice, privacy copy and API credentials |
| NEXT | CMS or structured editorial workflow | Editorial source format, validation and preview workflow agreed |
| DONE | Automated browser accessibility and Lighthouse checks | Rendered accessibility guards and Lighthouse run locally and in CI |

Update this table in the same commit whenever an item changes status.
