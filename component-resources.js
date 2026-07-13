(function registerComponentResources() {
  'use strict';

  // Resolve imported templates beside this loader. WordPress rewrites the loader URL
  // to the active theme directory, while the standalone site continues to use `./`.
  const loaderUrl = new URL(document.currentScript.src, window.location.href);
  const version = loaderUrl.searchParams.get('ver');
  const resources = window.__resources || {};

  const componentFiles = [
    'HeaderSection.dc.html',
    'HeroSection.dc.html',
    'ReleaseSection.dc.html',
    'StorySection.dc.html',
    'TicketsSection.dc.html',
    'VideosSection.dc.html',
    'ShortsSection.dc.html',
    'CastSection.dc.html',
    'FooterSection.dc.html'
  ];

  for (const file of componentFiles) {
    const componentUrl = new URL(file, loaderUrl);
    if (version) componentUrl.searchParams.set('ver', version);
    resources[`./${file}`] = componentUrl.href;
  }

  window.__resources = resources;
})();
