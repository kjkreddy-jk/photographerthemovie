import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const same = (actual, expected, message) => {
  assert(JSON.stringify(actual) === JSON.stringify(expected), message);
};

const html = read('index.html');
const editorialContent = JSON.parse(read('content/site-content.json'));
delete editorialContent.$schema;
const contentSource = read('site-content.js');
const resourceSource = read('component-resources.js');
const supportSource = read('support.js');
const css = read('site.css');
const qualityWorkflow = read('.github/workflows/site-quality.yml');
const version = read('VERSION').trim();
const componentFiles = [
  'HeaderSection.dc.html', 'HeroSection.dc.html', 'ReleaseSection.dc.html',
  'StorySection.dc.html', 'TicketsSection.dc.html', 'VideosSection.dc.html',
  'ShortsSection.dc.html', 'CastSection.dc.html', 'FooterSection.dc.html'
];
const componentTemplates = componentFiles.map(file => read(file));
const allTemplates = [html, ...componentTemplates].join('\n');

// Parse executable assets without starting the browser-dependent runtime.
new Function(supportSource);
new Function(resourceSource);
const context = vm.createContext({ window: {} });
context.window.window = context.window;
vm.runInContext(contentSource, context, { filename: 'site-content.js' });
const content = context.window.PHOTOGRAPHER_SITE_CONTENT;

// Simulate WordPress' cache-busted loader URL and verify imported templates inherit it.
const resourceContext = vm.createContext({
  URL,
  document: { currentScript: { src: `https://example.test/wp-content/themes/photographer/component-resources.js?ver=${version}` } },
  window: { location: { href: 'https://example.test/' } }
});
vm.runInContext(resourceSource, resourceContext, { filename: 'component-resources.js' });
for (const file of componentFiles) {
  assert(resourceContext.window.__resources[`./${file}`] === `https://example.test/wp-content/themes/photographer/${file}?ver=${version}`, `cache-busted theme mapping changed: ${file}`);
}

assert(content && content.film, 'site-content.js did not register campaign data');
same(content, editorialContent, 'generated site-content.js does not match content/site-content.json');
assert(fs.existsSync(path.join(root, 'content', 'site-content.schema.json')), 'editorial JSON schema is missing');
assert(/^\d+\.\d+\.\d+$/.test(version), 'VERSION must use semantic versioning');
assert(content.build && content.build.version === version, 'site-content.js build version does not match VERSION');
assert(Object.isFrozen(content) && Object.isFrozen(content.cast), 'campaign data must remain deeply frozen');
assert(/^\d{4}-\d{2}-\d{2}$/.test(content.film.releaseDate), 'releaseDate must use YYYY-MM-DD');
assert(new Date(content.film.releaseDate + 'T00:00:00Z').toISOString().slice(0, 10) === content.film.releaseDate, 'releaseDate is not a real calendar date');
assert(content.film.heroVideoId, 'heroVideoId is required');
assert(content.contact?.email === 'support@photographerthemovie.com', 'public contact email changed unexpectedly');
assert(new Set(content.navigation.map(item => item.href)).size === content.navigation.length, 'navigation href values must be unique');
for (const item of content.navigation) {
  assert(item.label && /^#[a-z][\w-]*$/i.test(item.href), 'navigation items need a label and a valid section href');
}
for (const item of [...content.booking.partners, ...content.social.film, ...content.social.artist]) {
  assert(item.label && new URL(item.href).protocol === 'https:', 'outbound content links must use HTTPS and include a label');
}
for (const item of [...content.videos, ...content.shorts]) {
  assert(item.title, 'every media item needs a title');
}
assert(new Set(content.cast.map(person => person.name)).size === content.cast.length, 'cast names must be unique');
assert(typeof content.notifications?.enabled === 'boolean', 'notification enabled state must be explicit');
if (content.notifications.enabled) {
  assert(new URL(content.notifications.endpoint).protocol === 'https:', 'notification endpoint must use HTTPS');
  assert(new URL(content.notifications.privacyUrl).protocol === 'https:', 'notification privacy URL must use HTTPS');
  assert(content.notifications.consentText.trim(), 'enabled notifications need consent text');
}

const contentScriptAt = html.indexOf('<script src="./site-content.js" defer></script>');
const resourceScriptAt = html.indexOf('<script src="./component-resources.js" defer></script>');
const runtimeScriptAt = html.indexOf('<script src="./support.js" defer></script>');
assert(contentScriptAt >= 0 && resourceScriptAt > contentScriptAt && runtimeScriptAt > resourceScriptAt, 'data and component resources must load before support.js');
assert(!/<dc-import\b[^>]*\/>/.test(html), 'dc-import elements need explicit closing tags so sibling imports are not nested by the HTML parser');
assert(html.includes('aria-expanded="{{ mobileNavOpen }}"') || componentTemplates.some(template => template.includes('aria-expanded="{{ mobileNavOpen }}"')), 'mobile navigation needs an aria-expanded state');
assert(css.includes('@media (max-width:760px)') && css.includes('@media (prefers-reduced-motion:reduce)'), 'responsive and reduced-motion styles are required');
assert(css.includes('.mobile-nav-toggle{display:none;width:44px;height:44px;'), 'mobile navigation toggle must retain a 44px touch target');
assert(html.includes("this.state.mobileNavOpen && e.key === 'Escape'"), 'mobile navigation must close on Escape');
assert(html.includes("body: JSON.stringify({ email, consent: true, source: 'website-footer' })"), 'notification client payload guard changed');
assert(html.includes("if (!config.configured)"), 'notification client must fail closed when configuration is incomplete');
assert(componentTemplates.some(template => template.includes('role="status"') && template.includes('aria-live="polite"')), 'notification feedback needs an accessible live region');
assert(html.includes(`<meta name="site-version" content="${version}">`), 'HTML site-version does not match VERSION');
assert(html.includes('"datePublished": "2026-08-07"'), 'static release metadata is stale');
assert(html.includes('"contentRating": "U/13"'), 'static certification metadata is stale');
assert(html.includes('assets/generated/share-poster-1920.jpg'), 'static share artwork is not configured');
assert(html.includes('<link rel="stylesheet" href="./site.css">'), 'site.css is not linked');
assert(fs.existsSync(path.join(root, 'site-content.js')) && fs.existsSync(path.join(root, 'component-resources.js')) && fs.existsSync(path.join(root, 'support.js')) && fs.existsSync(path.join(root, 'site.css')), 'a linked local asset is missing');
for (const command of ['npm test', 'images:test', 'check-render.ps1', 'build-theme.ps1 -CheckOnly', 'check-lighthouse.ps1']) {
  assert(qualityWorkflow.includes(command), `CI quality workflow is missing ${command}`);
}
assert(fs.existsSync(path.join(root, 'scripts', 'assert-lighthouse.mjs')), 'Lighthouse score assertion is missing');
for (const file of componentFiles) {
  const name = path.basename(file, '.dc.html');
  assert(html.includes(`<dc-import name="${name}"`), `index.html does not import ${name}`);
  assert(fs.existsSync(path.join(root, file)), `component file is missing: ${file}`);
  assert((read(file).match(/<x-dc>/g) || []).length === 1, `${file} must contain one x-dc root`);
  assert(resourceSource.includes(`'${file}'`), `component resource mapping is missing: ${file}`);
}
assert((css.match(/{/g) || []).length === (css.match(/}/g) || []).length, 'site.css contains unbalanced braces');
const reusableClasses = [
  'site-container', 'media-heading-row', 'section-kicker', 'section-heading',
  'release-badge', 'countdown-unit', 'countdown-value', 'countdown-label',
  'fact-row', 'fact-label', 'fact-value', 'story-copy', 'footer-heading', 'footer-meta', 'external-icon'
];
for (const className of reusableClasses) {
  assert(css.includes(`.${className}{`), `site.css is missing .${className}`);
  assert(new RegExp(`class="[^"]*\\b${className}\\b`).test(allTemplates), `templates do not use .${className}`);
}
const extractedStyles = [
  'min-width:66px;text-align:center;border:1px solid var(--border);background:var(--surface)',
  'font-family:var(--font-mono);font-size:28px;font-weight:600;color:var(--text);line-height:1;',
  'display:flex;justify-content:space-between;gap:16px;padding-bottom:12px;border-bottom:1px solid var(--border);',
  'display:inline-block;width:11px;height:11px;vertical-align:-1px;margin-left:5px;background-color:currentColor;opacity:0.72;'
];
for (const declaration of extractedStyles) {
  assert(!allTemplates.includes(`style="${declaration}`), `an extracted inline declaration returned: ${declaration}`);
}

const ids = [...allTemplates.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert(new Set(ids).size === ids.length, 'page templates contain duplicate IDs');
for (const item of content.navigation) {
  assert(ids.includes(item.href.slice(1)), `navigation target is missing: ${item.href}`);
}
for (const match of allTemplates.matchAll(/<button\b[^>]*>/g)) {
  assert(/\btype="(?:button|submit|reset)"/.test(match[0]), 'every button needs an explicit valid type');
}
for (const match of allTemplates.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
  assert(/\brel="[^"]*noopener[^"]*noreferrer[^"]*"/.test(match[0]), 'new-tab links need noopener and noreferrer');
}
assert((html.match(/<main\b/g) || []).length === 1 && (html.match(/<\/main>/g) || []).length === 1, 'index.html must contain one balanced main landmark');

const componentTagAt = html.indexOf('<script type="text/x-dc"');
const componentStart = html.indexOf('>', componentTagAt) + 1;
const componentEnd = html.indexOf('</script>', componentStart);
assert(componentTagAt >= 0 && componentEnd > componentStart, 'component script was not found');
const Component = new Function('DCLogic', 'window', html.slice(componentStart, componentEnd) + '; return Component;')(class {}, context.window);
const component = Object.create(Component.prototype);
component.props = {};
component.state = { look: 'forest-noir', modal: null, cd: { d: '1', h: '02', m: '03', s: '04' }, muted: true, showNav: true, mobileNavOpen: false, notificationBusy: false, notificationStatus: '' };
const values = component.renderVals();
const links = (items) => items.map(item => ({ l: item.label, h: item.href }));

assert(values.filmTitle === content.film.title, 'film title binding changed');
assert(values.siteVersion === version, 'rendered site version changed');
assert(values.releaseDateIso === content.film.releaseDate, 'release date binding changed');
assert(component.heroVideoId() === content.film.heroVideoId, 'hero video binding changed');
same(values.navLinks, links(content.navigation), 'navigation mapping changed');
same(values.cities, content.booking.cities, 'city mapping changed');
same(values.partners, links(content.booking.partners), 'booking partner mapping changed');
assert(values.trailers.length === content.videos.length, 'video card count changed');
assert(values.shorts.length === content.shorts.length, 'short card count changed');
assert(values.cast.length === content.cast.length, 'cast card count changed');
assert(values.crew.length === content.crew.length, 'crew row count changed');
assert(values.notificationConfigured === false, 'unconfigured notification client must remain disabled');
assert(values.notificationEmailMode === true, 'contact-email subscription fallback must remain available');
assert(values.contactEmail === content.contact.email, 'contact email binding changed');
assert(values.subscriptionMailto.startsWith(`mailto:${content.contact.email}?subject=`), 'subscription email link changed');
assert(values.notificationStatus === '', 'notification status must start empty');

component.props = { releaseDate: '2027-01-02', heroVideoId: 'override-id' };
assert(component.releaseInfo().iso === '2027-01-02', 'releaseDate editor override no longer wins');
assert(component.heroVideoId() === 'override-id', 'heroVideoId editor override no longer wins');

console.log('Site verification passed: content schema, script order, markup guards, mappings and overrides.');
