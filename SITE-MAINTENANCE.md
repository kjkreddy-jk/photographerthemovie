# Site maintenance

## Routine campaign updates

Edit `content/site-content.json` for release information, the hero video, navigation, booking cities and partners, social links, video cards, shorts, cast, crew and notification settings. Run `npm run content:build` to regenerate `site-content.js`; never hand-edit the generated file. The runtime data remains deeply frozen so components cannot mutate the shared source accidentally. See `CONTENT-EDITOR-GUIDE.md`.

`index.html` is the page shell, metadata source and shared component controller. The header, hero, release, story, tickets, videos, shorts, cast and footer live in focused `*.dc.html` files. Keep each section's established ID and pass data through its `<dc-import>` attributes so navigation, deep links and editor behavior stay stable.

`component-resources.js` maps imported templates beside its own URL. This lets the same files load from the project root during local preview and from the active theme directory in WordPress. Add every new component filename to that map and to the component list in `scripts/verify-site.mjs`.

The `releaseDate` and `heroVideoId` editor fields in `index.html` are optional overrides; blank values use `site-content.js`.

After an update, run:

```powershell
npm test
npm run images:test
.\scripts\check-render.ps1
```

The check covers the content schema, asset load order, unique IDs, button and external-link guards, component mappings, card counts, and editor-override precedence.

Shared focus, accessibility, reset and motion styles live in `site.css`. Keep section-specific visual rules in `index.html` until that section is deliberately extracted and regression-tested.

For a release, update `VERSION`, `content/site-content.json`'s build version, the HTML `site-version`, the theme version, and `CHANGELOG.md`, then regenerate `site-content.js`. The verification command rejects mismatches or stale generated content.

Run `scripts/check-render.ps1` for interaction and DOM accessibility coverage and `scripts/check-lighthouse.ps1` for the Lighthouse accessibility gate. GitHub repeats both checks through `.github/workflows/site-quality.yml` on pushes and pull requests.

## Metadata limitation

Social crawlers generally do not execute `site-content.js`. When the confirmed release date, canonical URL, trailer ID, or share artwork changes, also update the static Open Graph, Twitter, and JSON-LD values near the top of `index.html`. The maintenance comment there marks the relevant block.

## Images and notification delivery

Approved high-resolution image originals live in `assets/img` at the paths declared by `content/image-sources.json`. Run `node .\scripts\build-images.mjs`, then its `--check` mode, before packaging. Generated variants are copied into the WordPress package automatically. Do not substitute unapproved or upscaled campaign artwork.

Notification delivery is fail-closed until all fields are configured. Follow `NOTIFICATION-INTEGRATION.md`; provider credentials and mailing-list operations stay server-side.

## WordPress package

`wp-theme/photographer-official-theme` is generated from the root shared assets. Do not copy only `index.html`; run `.\scripts\build-theme.ps1` so HTML, CSS, content, runtime, version and ZIP stay synchronized.
