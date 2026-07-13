# Changelog

## 1.5.0 — 2026-07-13

- Added GitHub Actions quality gates for source validation, rendered interactions, WordPress package synchronization and Lighthouse.
- Expanded the rendered audit to cover landmarks, heading order, accessible control names, image alternatives and frame titles.
- Added a pinned Lighthouse 13.3.0 runner with repository-owned accessibility, best-practices and SEO score assertions.
- Fixed the shared low-contrast text token across all themes and added an inline favicon to prevent avoidable console errors.

## 1.4.0 — 2026-07-13

- Completed the modular rollout for the header, hero, release, story, tickets, videos, shorts, cast and footer sections.
- Added a responsive mobile navigation menu with accessible state, 44-pixel touch target, link and Escape dismissal, focus return and resize cleanup.
- Preserved desktop header hiding, content bindings, section anchors, modal behavior and WordPress cache-busted component loading.
- Expanded verification coverage for all component resources, responsive styles and rendered mobile-menu interactions.

## 1.3.0 — 2026-07-13

- Began the modular section rollout by extracting the story and tickets sections into importable templates without changing their anchors or data bindings.
- Added environment-aware component resource mapping so imports work from both the standalone site and the WordPress theme directory.
- Expanded source and rendered-DOM checks to cover component availability, script order, section rendering and booking content.
- Improved live-version failure diagnostics with observed version, server and cache response details.

## 1.2.0 — 2026-07-13

- Extracted repeated containers, section headings, release badges, countdown units, story facts, footer typography and external-link icons into reusable CSS primitives.
- Preserved section-specific layout exceptions inline to avoid changing established rendering behavior.
- Expanded verification coverage for reusable CSS classes and removal of the duplicated style declarations.
- Added a reusable Microsoft Edge rendered-DOM and computed-style smoke test.

## 1.1.0 — 2026-07-13

- Fixed document semantics, keyboard accessibility, modal focus behavior, navigation visibility, form behavior, release-date consistency, external-link security and media fallbacks.
- Added centralized campaign content in `site-content.js` while retaining editor overrides.
- Added semantic deployment version markers, shared shell CSS, verification tooling and a reproducible WordPress package build.
- Added maintenance, publishing and improvement-roadmap documentation.

## 1.0.0

- Initial WordPress theme publication.
