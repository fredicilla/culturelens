// ── CultureLens bottom navigation ──
// Each page sets `window.ACTIVE_NAV = 'explore' | 'community' | 'account'`
// before loading this script. The nav renders itself on the paper, with a short
// bar in the region's color over the active item.
(function () {
  var active = (typeof window.ACTIVE_NAV === 'string') ? window.ACTIVE_NAV : '';

  // ── styles ──
  var css = [
    'body { padding-bottom: calc(66px + env(safe-area-inset-bottom, 0px)); }',
    '.cl-bottom-nav {',
    '  position: fixed; z-index: 140; left: 0; right: 0; bottom: 0;',
    '  max-width: 430px; margin: 0 auto;',
    '  height: calc(66px + env(safe-area-inset-bottom, 0px)); padding: 0 8px env(safe-area-inset-bottom, 0px);',
    '  display: flex; justify-content: space-around; align-items: stretch;',
    '  background: #FFFFFF; box-shadow: 0 -1px 0 rgba(15, 40, 55, 0.08), 0 -6px 20px rgba(15, 40, 55, 0.05);',
    '}',
    '.cl-nav-item {',
    '  position: relative; flex: 1;',
    '  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;',
    '  text-decoration: none; color: #8C99A1;',
    '  font-family: var(--f, inherit); font-size: 12px; font-weight: 600;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '.cl-nav-item .cl-nav-icon { width: 23px; height: 23px; display: flex; align-items: center; justify-content: center; }',
    '.cl-nav-item .cl-nav-icon svg { width: 100%; height: 100%; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }',
    '.cl-nav-item.active { color: #EB5A3C; font-weight: 700; }',
    '.cl-nav-item.active::before {',
    '  content: ""; position: absolute; top: 0; left: 50%; width: 34px; height: 3px; margin-left: -17px; border-radius: 0 0 3px 3px;',
    '  background: #EB5A3C;',
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
    { key: 'explore',   href: 'index.html',     en: 'Explore',   ar: 'استكشف' },
    { key: 'community', href: 'community.html', en: 'Community', ar: 'المجتمع' },
    { key: 'account',   href: 'account.html',   en: 'Account',   ar: 'حسابي' }
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

  // the header (Figma): the logo with its name on one side; the assistant and the language on the other
  function header() {
    var brand = document.querySelector('.cl-header .brand');
    if (brand && !brand.querySelector('.brand-mark')) {
      brand.insertAdjacentHTML('beforeend', '<img class="brand-mark" src="logo-mark.svg" alt=""><span class="brand-name translatable" data-en="CultureLens" data-ar="عدسة ثقافية">' + (window.currentLang === 'en' ? 'CultureLens' : 'عدسة ثقافية') + '</span>');
    }
    var actions = document.querySelector('.cl-header .hdr-actions');
    if (actions && !document.getElementById('cl-ask')) {
      var b = document.createElement('button');
      b.type = 'button'; b.id = 'cl-ask'; b.className = 'cl-ask';
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l1.6 4.4 4.4 1.6-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></svg><span class="translatable" data-en="Assistant" data-ar="المساعد">' + (window.currentLang === 'en' ? 'Assistant' : 'المساعد') + '</span>';
      b.addEventListener('click', function () {
        if (window.clSound) window.clSound.prime();
        if (window.__najdGuide) window.__najdGuide.open();
      });
      actions.insertBefore(b, actions.firstChild);
    }
  }

  function mount() {
    header();
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
