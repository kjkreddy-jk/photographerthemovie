const socketUrl = process.env.EDGE_CDP_WS;
const expectedVersion = process.env.SITE_EXPECTED_VERSION;
if (!socketUrl || !expectedVersion) throw new Error('Missing render-check environment values.');

const socket = new WebSocket(socketUrl);
const timeout = setTimeout(() => {
  console.error('Rendered-page check timed out.');
  process.exit(1);
}, 12000);

socket.onopen = () => {
  setTimeout(() => {
    const expression = `(() => {
      const pick = selector => document.querySelector(selector);
      const style = selector => {
        const element = pick(selector);
        return element ? getComputedStyle(element) : null;
      };
      return {
        ready: document.readyState,
        contentLoaded: !!window.PHOTOGRAPHER_SITE_CONTENT,
        version: document.querySelector('meta[name="site-version"]')?.content,
        footerVersion: document.body.innerText.includes('Site v${expectedVersion}'),
        unresolvedBinding: document.body.innerHTML.includes('{{'),
        controlTagsRemaining: document.querySelectorAll('sc-for, sc-if, x-dc').length,
        releaseBadgeCount: document.querySelectorAll('.release-badge').length,
        countdownCount: document.querySelectorAll('.countdown-unit').length,
        externalIconCount: document.querySelectorAll('.external-icon').length,
        badgeRadius: style('.release-badge')?.borderRadius,
        countdownMinWidth: style('.countdown-unit')?.minWidth,
        containerMaxWidth: style('.site-container')?.maxWidth,
        stylesheetLoaded: [...document.styleSheets].some(sheet => sheet.href?.includes('/site.css')),
        renderError: !!document.querySelector('.dc-error, [data-dc-error]')
      };
    })()`;
    socket.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: { expression, returnByValue: true }
    }));
  }, 2500);
};

socket.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id !== 1) return;
  clearTimeout(timeout);
  const result = message.result?.result?.value;
  console.log(JSON.stringify(result, null, 2));
  const passed = result
    && result.ready === 'complete'
    && result.contentLoaded
    && result.version === expectedVersion
    && result.footerVersion
    && !result.unresolvedBinding
    && result.controlTagsRemaining === 0
    && result.releaseBadgeCount === 5
    && result.countdownCount === 4
    && result.externalIconCount === 9
    && result.badgeRadius === '999px'
    && result.countdownMinWidth === '66px'
    && result.containerMaxWidth === '1360px'
    && result.stylesheetLoaded
    && !result.renderError;
  if (!passed) process.exitCode = 1;
  socket.close();
};

socket.onerror = () => {
  clearTimeout(timeout);
  process.exit(1);
};
