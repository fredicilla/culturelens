// ── CultureLens bottom navigation ──
// Each page sets `window.ACTIVE_NAV = 'explore' | 'community' | 'account'`
// before loading this script. The nav renders itself and highlights the
// active item in gold.
(function () {
  var active = (typeof window.ACTIVE_NAV === 'string') ? window.ACTIVE_NAV : '';

  // ── styles ──
  var css = [
    'body { padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }',
    '.cl-bottom-nav {',
    '  position: fixed;',
    '  left: 0; right: 0; bottom: 0;',
    '  z-index: 110;',
    '  display: flex;',
    '  justify-content: space-around;',
    '  align-items: stretch;',
    '  padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 8px));',
    '  background: rgba(13, 59, 42, 0.92);',
    '  -webkit-backdrop-filter: blur(18px) saturate(1.3);',
    '  backdrop-filter: blur(18px) saturate(1.3);',
    '  border-top: 1px solid rgba(201, 168, 76, 0.22);',
    '  border-top-left-radius: 20px;',
    '  border-top-right-radius: 20px;',
    '  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.35);',
    '}',
    '.cl-nav-item {',
    '  flex: 1;',
    '  display: flex;',
    '  flex-direction: column;',
    '  align-items: center;',
    '  justify-content: center;',
    '  gap: 4px;',
    '  padding: 6px 4px;',
    '  text-decoration: none;',
    '  color: var(--text-light, rgba(168, 200, 176, 0.7));',
    '  font-size: 11px;',
    '  font-weight: 600;',
    '  letter-spacing: 0.3px;',
    '  border-radius: 14px;',
    '  transition: color 0.2s ease, background 0.2s ease, transform 0.15s ease;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '.cl-nav-item:active { transform: scale(0.94); }',
    '.cl-nav-item .cl-nav-icon {',
    '  width: 24px; height: 24px;',
    '  display: flex; align-items: center; justify-content: center;',
    '}',
    '.cl-nav-item .cl-nav-icon svg {',
    '  width: 100%; height: 100%;',
    '  stroke: currentColor;',
    '  fill: none;',
    '  stroke-width: 1.8;',
    '  stroke-linecap: round;',
    '  stroke-linejoin: round;',
    '  transition: stroke 0.2s ease;',
    '}',
    '.cl-nav-item.active {',
    '  color: var(--gold, #C9A84C);',
    '  background: rgba(201, 168, 76, 0.10);',
    '}',
    '.cl-nav-item.active .cl-nav-label {',
    '  text-shadow: 0 0 14px rgba(201, 168, 76, 0.45);',
    '}'
  ].join('\n');

  var style = document.createElement('style');
  style.id = 'cl-bottom-nav-styles';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  // ── icons (inline SVG, pure strokes) ──
  var icons = {
    explore: // compass rose: circle + 4-point star needle
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="9"></circle>' +
        '<path d="M12 3 L13.2 10.8 L21 12 L13.2 13.2 L12 21 L10.8 13.2 L3 12 L10.8 10.8 Z" fill="currentColor" stroke="none"></path>' +
      '</svg>',
    community: // speech bubble with small dots
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 6.5 A2.5 2.5 0 0 1 6.5 4 H17.5 A2.5 2.5 0 0 1 20 6.5 V14 A2.5 2.5 0 0 1 17.5 16.5 H10 L6 20 V16.5 H6.5 A2.5 2.5 0 0 1 4 14 Z"></path>' +
        '<circle cx="9" cy="10.2" r="0.9" fill="currentColor" stroke="none"></circle>' +
        '<circle cx="12" cy="10.2" r="0.9" fill="currentColor" stroke="none"></circle>' +
        '<circle cx="15" cy="10.2" r="0.9" fill="currentColor" stroke="none"></circle>' +
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
    // re-translate freshly injected nodes if language.js exposes applyLanguage
    if (typeof window.applyLanguage === 'function') window.applyLanguage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
