import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'content', 'site-content.json');
const outputPath = path.join(root, 'site-content.js');
const checkOnly = process.argv.includes('--check');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
delete source.$schema;

const fail = message => { throw new Error(`Content validation: ${message}`); };
const requiredText = (value, name) => { if (typeof value !== 'string' || !value.trim()) fail(`${name} is required`); };
const isHttpsUrl = value => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};
requiredText(source.build?.version, 'build.version');
if (!/^\d+\.\d+\.\d+$/.test(source.build.version)) fail('build.version must be semantic');
requiredText(source.film?.title, 'film.title');
requiredText(source.film?.heroVideoId, 'film.heroVideoId');
if (!/^\d{4}-\d{2}-\d{2}$/.test(source.film?.releaseDate || '')) fail('film.releaseDate must use YYYY-MM-DD');
if (new Date(`${source.film.releaseDate}T00:00:00Z`).toISOString().slice(0, 10) !== source.film.releaseDate) fail('film.releaseDate is not a real date');
if (!Array.isArray(source.navigation) || !source.navigation.length) fail('navigation needs at least one item');
for (const [index, item] of source.navigation.entries()) {
  requiredText(item.label, `navigation[${index}].label`);
  if (!/^#[A-Za-z][\w-]*$/.test(item.href || '')) fail(`navigation[${index}].href must be a section hash`);
}
for (const group of [source.booking?.partners || [], ...Object.values(source.social || {})]) {
  for (const item of group) {
    requiredText(item.label, 'external link label');
    if (!isHttpsUrl(item.href)) fail(`external link must use a valid HTTPS URL: ${item.href || '(empty)'}`);
  }
}
const notifications = source.notifications || {};
if (typeof notifications.enabled !== 'boolean') fail('notifications.enabled must be boolean');
for (const key of ['endpoint', 'privacyUrl', 'consentText']) {
  if (typeof notifications[key] !== 'string') fail(`notifications.${key} must be a string`);
}
if (notifications.enabled && !(isHttpsUrl(notifications.endpoint) && isHttpsUrl(notifications.privacyUrl) && notifications.consentText.trim())) {
  fail('enabled notifications require an HTTPS endpoint, HTTPS privacy URL and consent text');
}

const serialized = JSON.stringify(source, null, 2);
const generated = `(function registerPhotographerSiteContent(global) {\n  'use strict';\n\n  // Generated from content/site-content.json by scripts/build-content.mjs.\n  const content = ${serialized.replace(/^/gm, '  ').trimStart()};\n\n  const deepFreeze = (value) => {\n    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;\n    Object.values(value).forEach(deepFreeze);\n    return Object.freeze(value);\n  };\n\n  global.PHOTOGRAPHER_SITE_CONTENT = deepFreeze(content);\n})(window);\n`;

if (checkOnly) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== generated) fail('site-content.js is stale; run node scripts/build-content.mjs');
  console.log('Structured campaign content is valid and site-content.js is current.');
} else {
  fs.writeFileSync(outputPath, generated);
  console.log('Generated site-content.js from content/site-content.json.');
}
