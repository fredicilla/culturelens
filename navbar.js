// ── CultureLens bottom navigation ──
// Each page sets `window.ACTIVE_NAV = 'explore' | 'community' | 'account'`
// before loading this script. The nav renders itself on the paper, with a short
// bar in the region's color over the active item.
(function () {
  var active = (typeof window.ACTIVE_NAV === 'string') ? window.ACTIVE_NAV : '';

  // ── styles ──
  var css = [
    'body { padding-bottom: calc(62px + env(safe-area-inset-bottom, 0px)); }',
    '.cl-bottom-nav {',
    '  position: fixed; z-index: 140; left: 0; right: 0; bottom: 0;',
    '  max-width: 430px; margin: 0 auto;',
    '  height: calc(62px + env(safe-area-inset-bottom, 0px)); padding: 0 8px env(safe-area-inset-bottom, 0px);',
    '  display: flex; justify-content: space-around; align-items: stretch;',
    '  background: #F4EEE4; border-top: 1px solid rgba(22, 18, 29, 0.14);',
    '}',
    '.cl-nav-item {',
    '  position: relative; flex: 1;',
    '  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;',
    '  text-decoration: none; color: #7C7382;',
    '  font-family: var(--f, inherit); font-size: 11.5px; font-weight: 600;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '.cl-nav-item .cl-nav-icon { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; }',
    '.cl-nav-item .cl-nav-icon svg { width: 100%; height: 100%; stroke: currentColor; fill: none; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }',
    '.cl-nav-item.active { color: #16121D; }',
    '.cl-nav-item.active::before {',
    '  content: ""; position: absolute; top: -1px; left: 50%; width: 30px; height: 2px; margin-left: -15px;',
    '  background: var(--acc, #16121D);',
    '}'
  ].join('\n');

  var style = document.createElement('style');
  style.id = 'cl-bottom-nav-styles';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  // ── icons (inline SVG, pure strokes) ──
  var icons = {
    explore: // a folded map
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2-6-2z"></path>' +
        '<path d="M9 4.5v13M15 6.5v13"></path>' +
      '</svg>',
    community: // a speech bubble
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 6.5 A2.5 2.5 0 0 1 6.5 4 H17.5 A2.5 2.5 0 0 1 20 6.5 V14 A2.5 2.5 0 0 1 17.5 16.5 H10 L6 20 V16.5 H6.5 A2.5 2.5 0 0 1 4 14 Z"></path>' +
      '</svg>',
    account: // person silhouette: head + shoulders
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<circle cx="12" cy="8" r="3.6"></circle>' +
        '<path d="M4.5 20 C5.5 15.8 8.5 13.8 12 13.8 C15.5 13.8 18.5 15.8 19.5 20"></path>' +
      '</svg>'
  };

  var items = [
    { key: 'explore',   href: 'index.html',     en: 'Explore',   ar: 'استكشاف' },
    { key: 'community', href: 'community.html', en: 'Community', ar: 'المجتمع' },
    { key: 'account',   href: 'account.html',   en: 'Account',   ar: 'الحساب' }
  ];

  var nav = document.createElement('nav');
  nav.className = 'cl-bottom-nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Primary');

  nav.innerHTML = items.map(function (it) {
    var isActive = it.key === active;
    return '' +
      '<a href="' + it.href + '" class="cl-nav-item' + (isActive ? ' active' : '') + '"' +
        (isActive ? ' aria-current="page"' : '') + '>' +
        '<span class="cl-nav-icon">' + icons[it.key] + '</span>' +
        '<span class="cl-nav-label translatable" data-en="' + it.en + '" data-ar="' + it.ar + '">' + it.en + '</span>' +
      '</a>';
  }).join('');

  function mount() {
    document.body.appendChild(nav);
    // re-translate freshly injected nodes (through ThemeManager so region dialect applies)
    if (window.ThemeManager && typeof window.ThemeManager.applyDialect === 'function') window.ThemeManager.applyDialect();
    else if (typeof window.applyLanguage === 'function') window.applyLanguage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
