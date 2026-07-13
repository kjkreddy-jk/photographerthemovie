# Approved image sources

Place the approved, full-resolution originals here using the filenames in `content/image-sources.json`.

Required files:

- `hero-poster.jpg`
- `share-poster.jpg`

Do not upscale small web downloads. Preserve the master artwork elsewhere; this folder is the reproducible web-build input. Run `npm ci` and then `node scripts/build-images.mjs` to generate AVIF, WebP and JPEG variants in `assets/generated`.
