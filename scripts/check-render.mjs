const socketUrl = process.env.EDGE_CDP_WS;
const expectedVersion = process.env.SITE_EXPECTED_VERSION;
if (!socketUrl || !expectedVersion) throw new Error('Missing render-check environment values.');

const socket = new WebSocket(socketUrl);
const results = {};
const timeout = setTimeout(() => {
  console.error('Rendered-page check timed out.');
  process.exit(1);
}, 15000);

const send = (id, method, params = {}) => socket.send(JSON.stringify({ id, method, params }));
const evaluate = (id, expression) => send(id, 'Runtime.evaluate', { expression, returnByValue: true });
const finish = (passed) => {
  clearTimeout(timeout);
  console.log(JSON.stringify(results, null, 2));
  if (!passed) process.exitCode = 1;
  socket.close();
};

socket.onopen = () => {
  // A phone-sized viewport lets this one smoke test cover responsive rendering too.
  send(1, 'Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });
};

socket.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id === 1) {
    setTimeout(() => evaluate(2, `(() => {
      const pick = selector => document.querySelector(selector);
      const style = selector => {
        const element = pick(selector);
        return element ? getComputedStyle(element) : null;
      };
      const toggle = pick('.mobile-nav-toggle');
      const toggleRect = toggle?.getBoundingClientRect();
      const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')];
      const headingLevels = headings.map(heading => Number(heading.tagName.slice(1)));
      const headingOrderValid = headingLevels[0] === 1 && headingLevels.every((level, index) => index === 0 || level <= headingLevels[index - 1] + 1);
      const accessibleName = element => (
        element.getAttribute('aria-label')
        || (element.getAttribute('aria-labelledby') && document.getElementById(element.getAttribute('aria-labelledby'))?.textContent)
        || element.labels?.[0]?.textContent
        || element.textContent
        || element.getAttribute('title')
        || ''
      ).trim();
      const unlabeledControls = [...document.querySelectorAll('a[href], button, input, select, textarea')]
        .filter(element => !accessibleName(element))
        .map(element => element.tagName.toLowerCase());
      return {
        ready: document.readyState,
        contentLoaded: !!window.PHOTOGRAPHER_SITE_CONTENT,
        version: document.querySelector('meta[name="site-version"]')?.content,
        footerVersion: document.body.innerText.includes('Site v${expectedVersion}'),
        unresolvedBinding: document.body.innerHTML.includes('{{'),
        controlTagsRemaining: document.querySelectorAll('sc-for, sc-if, x-dc').length,
        sectionCount: document.querySelectorAll('main section').length,
        storySection: !!pick('#story'),
        ticketsSection: !!pick('#tickets'),
        storyRelease: pick('#story time')?.textContent,
        contentRatingVisible: document.body.innerText.includes('U/13'),
        contactHref: pick('a[href="mailto:support@photographerthemovie.com"]')?.getAttribute('href'),
        subscriptionHref: pick('#notification-email-link')?.getAttribute('href'),
        heroPosterLoaded: pick('#top picture img')?.complete && pick('#top picture img')?.naturalWidth > 0,
        ticketCityCount: document.querySelectorAll('#tickets .ticket-city').length,
        componentErrors: [...document.querySelectorAll('.sc-placeholder-error')].map(element => element.textContent),
        componentRequests: performance.getEntriesByType('resource').map(entry => entry.name).filter(name => name.includes('.dc.html')),
        releaseBadgeCount: document.querySelectorAll('.release-badge').length,
        countdownCount: document.querySelectorAll('.countdown-unit').length,
        externalIconCount: document.querySelectorAll('.external-icon').length,
        badgeRadius: style('.release-badge')?.borderRadius,
        countdownMinWidth: style('.countdown-unit')?.minWidth,
        containerMaxWidth: style('.site-container')?.maxWidth,
        stylesheetLoaded: [...document.styleSheets].some(sheet => sheet.href?.includes('/site.css')),
        renderError: !!document.querySelector('.dc-error, [data-dc-error]'),
        mobileToggleVisible: style('.mobile-nav-toggle')?.display !== 'none',
        mobileToggleWidth: toggleRect?.width,
        mobileToggleHeight: toggleRect?.height,
        mobileExpanded: toggle?.getAttribute('aria-expanded'),
        mobileNavVisibility: style('#primary-navigation')?.visibility,
        mobileNavLinks: document.querySelectorAll('#primary-navigation .site-nav-link').length,
        landmarkCounts: {
          header: document.querySelectorAll('header').length,
          nav: document.querySelectorAll('nav[aria-label]').length,
          main: document.querySelectorAll('main').length,
          footer: document.querySelectorAll('footer').length
        },
        h1Count: document.querySelectorAll('h1').length,
        headingOrderValid,
        unlabeledControls,
        imagesMissingAlt: document.querySelectorAll('img:not([alt])').length,
        iframesMissingTitle: [...document.querySelectorAll('iframe')].filter(frame => !frame.getAttribute('title')).length
      };
    })()`), 2500);
    return;
  }

  if (message.id === 2) {
    results.initial = message.result?.result?.value;
    const initial = results.initial;
    const initialPassed = initial
      && initial.ready === 'complete'
      && initial.contentLoaded
      && initial.version === expectedVersion
      && initial.footerVersion
      && !initial.unresolvedBinding
      && initial.controlTagsRemaining === 0
      && initial.sectionCount === 7
      && initial.storySection
      && initial.ticketsSection
      && initial.storyRelease === '7 Aug 2026'
      && initial.contentRatingVisible
      && initial.contactHref === 'mailto:support@photographerthemovie.com'
      && initial.subscriptionHref?.startsWith('mailto:support@photographerthemovie.com?subject=')
      && initial.heroPosterLoaded
      && initial.ticketCityCount === 6
      && initial.componentErrors.length === 0
      && initial.componentRequests.length === 9
      && initial.releaseBadgeCount === 5
      && initial.countdownCount === 4
      && initial.externalIconCount === 9
      && initial.badgeRadius === '999px'
      && initial.countdownMinWidth === '66px'
      && initial.containerMaxWidth === '1360px'
      && initial.stylesheetLoaded
      && !initial.renderError
      && initial.mobileToggleVisible
      && initial.mobileToggleWidth >= 44
      && initial.mobileToggleHeight >= 44
      && initial.mobileExpanded === 'false'
      && initial.mobileNavVisibility === 'hidden'
      && initial.mobileNavLinks === 6
      && initial.landmarkCounts.header === 1
      && initial.landmarkCounts.nav === 1
      && initial.landmarkCounts.main === 1
      && initial.landmarkCounts.footer === 1
      && initial.h1Count === 1
      && initial.headingOrderValid
      && initial.unlabeledControls.length === 0
      && initial.imagesMissingAlt === 0
      && initial.iframesMissingTitle === 0;
    if (!initialPassed) {
      finish(false);
      return;
    }
    evaluate(3, `document.querySelector('.mobile-nav-toggle').click()`);
    return;
  }

  if (message.id === 3) {
    setTimeout(() => evaluate(4, `(() => {
      const toggle = document.querySelector('.mobile-nav-toggle');
      const nav = document.querySelector('#primary-navigation');
      return {
        expanded: toggle?.getAttribute('aria-expanded'),
        label: toggle?.getAttribute('aria-label'),
        headerOpen: document.querySelector('.site-header')?.getAttribute('data-mobile-open'),
        visibility: nav ? getComputedStyle(nav).visibility : null,
        pointerEvents: nav ? getComputedStyle(nav).pointerEvents : null
      };
    })()`), 100);
    return;
  }

  if (message.id === 4) {
    results.open = message.result?.result?.value;
    const open = results.open;
    if (!(open && open.expanded === 'true' && open.label === 'Close navigation menu' && open.headerOpen === 'true' && open.visibility === 'visible' && open.pointerEvents === 'auto')) {
      finish(false);
      return;
    }
    evaluate(5, `document.querySelector('#primary-navigation .site-nav-link').click()`);
    return;
  }

  if (message.id === 5) {
    setTimeout(() => evaluate(6, `(() => {
      const toggle = document.querySelector('.mobile-nav-toggle');
      const nav = document.querySelector('#primary-navigation');
      return {
        expanded: toggle?.getAttribute('aria-expanded'),
        label: toggle?.getAttribute('aria-label'),
        visibility: nav ? getComputedStyle(nav).visibility : null,
        hash: window.location.hash
      };
    })()`), 300);
    return;
  }

  if (message.id === 6) {
    results.linkClosed = message.result?.result?.value;
    const linkClosed = results.linkClosed;
    if (!(linkClosed && linkClosed.expanded === 'false' && linkClosed.label === 'Open navigation menu' && linkClosed.visibility === 'hidden' && linkClosed.hash === '#top')) {
      finish(false);
      return;
    }
    evaluate(7, `document.querySelector('.mobile-nav-toggle').click()`);
    return;
  }

  if (message.id === 7) {
    setTimeout(() => evaluate(8, `document.querySelector('.mobile-nav-toggle').getAttribute('aria-expanded')`), 100);
    return;
  }

  if (message.id === 8) {
    if (message.result?.result?.value !== 'true') {
      finish(false);
      return;
    }
    evaluate(9, `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))`);
    return;
  }

  if (message.id === 9) {
    setTimeout(() => evaluate(10, `(() => {
      const toggle = document.querySelector('.mobile-nav-toggle');
      const nav = document.querySelector('#primary-navigation');
      return {
        expanded: toggle?.getAttribute('aria-expanded'),
        visibility: nav ? getComputedStyle(nav).visibility : null,
        focusReturned: document.activeElement === toggle
      };
    })()`), 300);
    return;
  }

  if (message.id === 10) {
    results.escapeClosed = message.result?.result?.value;
    const escapeClosed = results.escapeClosed;
    if (!(escapeClosed && escapeClosed.expanded === 'false' && escapeClosed.visibility === 'hidden' && escapeClosed.focusReturned)) {
      finish(false);
      return;
    }
    send(11, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    return;
  }

  if (message.id === 11) {
    setTimeout(() => evaluate(12, `(() => ({
      toggleDisplay: getComputedStyle(document.querySelector('.mobile-nav-toggle')).display,
      navDisplay: getComputedStyle(document.querySelector('#primary-navigation')).display,
      navVisibility: getComputedStyle(document.querySelector('#primary-navigation')).visibility,
      ctaDisplay: getComputedStyle(document.querySelector('.site-header-cta')).display
    }))()`), 100);
    return;
  }

  if (message.id === 12) {
    results.desktop = message.result?.result?.value;
    const desktop = results.desktop;
    if (!(desktop && desktop.toggleDisplay === 'none' && desktop.navDisplay === 'flex' && desktop.navVisibility === 'visible' && desktop.ctaDisplay !== 'none')) {
      finish(false);
      return;
    }
    evaluate(13, `document.querySelector('.trailer-button').click()`);
    return;
  }

  if (message.id === 13) {
    setTimeout(() => evaluate(14, `(() => ({
      dialogOpen: !!document.querySelector('[role="dialog"]'),
      dialogTitle: document.querySelector('#modal-title')?.textContent,
      closeFocused: document.activeElement === document.querySelector('[aria-label="Close video dialog"]'),
      pageLocked: document.documentElement.style.overflow === 'hidden'
    }))()`), 100);
    return;
  }

  if (message.id === 14) {
    results.modalOpen = message.result?.result?.value;
    const modalOpen = results.modalOpen;
    if (!(modalOpen && modalOpen.dialogOpen && modalOpen.dialogTitle?.includes('Official Trailer') && modalOpen.closeFocused && modalOpen.pageLocked)) {
      finish(false);
      return;
    }
    evaluate(15, `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))`);
    return;
  }

  if (message.id === 15) {
    setTimeout(() => evaluate(16, `({ dialogOpen: !!document.querySelector('[role="dialog"]'), pageUnlocked: document.documentElement.style.overflow === '' })`), 100);
    return;
  }

  if (message.id === 16) {
    results.modalClosed = message.result?.result?.value;
    if (!(results.modalClosed && !results.modalClosed.dialogOpen && results.modalClosed.pageUnlocked)) {
      finish(false);
      return;
    }
    send(17, 'Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    return;
  }

  if (message.id === 17) {
    evaluate(18, `(() => ({
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      toggleTransitionDuration: getComputedStyle(document.querySelector('.mobile-nav-toggle span')).transitionDuration
    }))()`);
    return;
  }

  if (message.id === 18) {
    results.reducedMotion = message.result?.result?.value;
    const reduced = results.reducedMotion;
    const duration = reduced?.toggleTransitionDuration || '';
    const durationSeconds = duration.endsWith('ms') ? Number.parseFloat(duration) / 1000 : Number.parseFloat(duration);
    if (!(reduced && reduced.scrollBehavior === 'auto' && Number.isFinite(durationSeconds) && durationSeconds <= 0.001)) {
      finish(false);
      return;
    }
    evaluate(19, `(() => {
      window.__notificationFetchCount = 0;
      const originalFetch = window.fetch;
      window.fetch = (...args) => { window.__notificationFetchCount += 1; return originalFetch(...args); };
      document.querySelector('.notification-request-button').click();
      return true;
    })()`);
    return;
  }

  if (message.id === 19) {
    setTimeout(() => evaluate(20, `(() => ({
      status: document.querySelector('#notification-status')?.textContent.trim(),
      fetchCount: window.__notificationFetchCount,
      emailLinkFocused: document.activeElement === document.querySelector('#notification-email-link')
    }))()`), 100);
    return;
  }

  if (message.id === 20) {
    results.notificationDisabled = message.result?.result?.value;
    const notification = results.notificationDisabled;
    finish(!!(notification
      && notification.status === 'Email support@photographerthemovie.com to request release updates.'
      && notification.fetchCount === 0
      && notification.emailLinkFocused));
  }
};

socket.onerror = () => {
  clearTimeout(timeout);
  process.exit(1);
};
