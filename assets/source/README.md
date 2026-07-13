# Approved image sources

The approved campaign repository now lives in `assets/img`, and `content/image-sources.json` identifies which originals produce the hero and social variants.

Do not upscale small web downloads. Preserve the master artwork elsewhere; `assets/img` is the reproducible web-build input. Run `npm ci` and then `node scripts/build-images.mjs` to generate AVIF, WebP and JPEG variants in `assets/generated`.
