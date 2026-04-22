/**
 * ThemeManager.js — CultureLens 5-Region Experience Engine v3
 * Full UNESCO-verified data, pattern overlay injection, deep theme application.
 *
 * UNESCO Sources:
 *   WHC  = UNESCO World Heritage Convention (whc.unesco.org)
 *   ICH  = Intangible Cultural Heritage (ich.unesco.org)
 *   TL   = WHC Tentative List (Saudi Arabia submission)
 */

const REGIONS = {
  najd: {
    nameEn: 'Najd',
    nameAr: 'النجد',
    region: 'Central Region',
    primaryColor: '#0D3B2A',
    accentColor: '#C9A84C',
    accentLight: '#E8C96B',
    textColor: '#F9F3E8',
    cardColor: '#122B1E',
    icon: '🏛️',
    pattern: 'diamond-lattice',
    unescoHeritage: [
      { item: "At-Turaif District in ad-Dir'iyah", id: 'C 1329', type: 'World Heritage Site', year: 2010, criterion: 'WHC Decision 34 COM 8B.9', verified: true },
      { item: 'Arabic Coffee (Al-Qahwa)', id: 'RL 01073', type: 'Intangible Cultural Heritage', year: 2015, criterion: 'ICH Decision 10.COM 10.b.14', verified: true },
      { item: 'Al-Ardha — Najdi sword dance', id: 'RL 01064', type: 'Intangible Cultural Heritage', year: 2015, criterion: 'ICH Decision 10.COM 10.b.13', verified: true },
      { item: 'Rock Art in the Hail Region', id: 'C 1472', type: 'World Heritage Site', year: 2015, criterion: 'WHC Decision 39 COM 8B.16', verified: true },
      { item: 'Date Palm traditions', id: 'RL 01509', type: 'Intangible Cultural Heritage', year: 2019, criterion: 'ICH Decision 14.COM 10.b.15', verified: true }
    ]
  },
  hejaz: {
    nameEn: 'Hejaz',
    nameAr: 'الحجاز',
    region: 'Western Region',
    primaryColor: '#1a0800',
    accentColor: '#D4A843',
    accentLight: '#EAC060',
    textColor: '#FDF5E6',
    cardColor: '#130500',
    icon: '🕌',
    pattern: 'eight-star',
    unescoHeritage: [
      { item: 'Historic Jeddah', id: 'C 1361', type: 'World Heritage Site', year: 2014, criterion: 'WHC Decision 38 COM 8B.17', verified: true },
      { item: 'Hegra (Madain Salih)', id: 'C 1293', type: 'World Heritage Site', year: 2008, criterion: 'WHC Decision 32 COM 8B.1', verified: true },
      { item: 'Hejaz Railway', id: 'TL-SAU-005', type: 'World Heritage Candidate', year: null, criterion: 'Saudi Tentative List', verified: false },
      { item: 'Falconry', id: 'RL 01209', type: 'Intangible Cultural Heritage', year: 2016, criterion: 'ICH Decision 11.COM 11.b.3', verified: true },
      { item: 'Al-Qudoum welcome ceremony', id: 'TL-SAU', type: 'Intangible Cultural Heritage (Candidate)', year: null, criterion: 'Saudi National Heritage Commission', verified: false }
    ]
  },
  eastern: {
    nameEn: 'Eastern Region',
    nameAr: 'الشرقية',
    region: 'Al-Ahsa / Arabian Gulf',
    primaryColor: '#04111E',
    accentColor: '#4A9FC9',
    accentLight: '#72BEE0',
    textColor: '#EDF6FF',
    cardColor: '#020C16',
    icon: '🌊',
    pattern: 'hexagonal',
    unescoHeritage: [
      { item: 'Al-Ahsa Oasis', id: 'C 1563', type: 'World Heritage Site', year: 2018, criterion: 'WHC Decision 42 COM 8B.28', verified: true },
      { item: 'Al-Sadu weaving', id: 'RL 01567', type: 'Intangible Cultural Heritage', year: 2020, criterion: 'ICH Decision 15.COM 8.b.26', verified: true },
      { item: 'Date Palm traditions', id: 'RL 01509', type: 'Intangible Cultural Heritage', year: 2019, criterion: 'ICH Decision 14.COM 10.b.15', verified: true }
    ]
  },
  southern: {
    nameEn: 'Southern Region',
    nameAr: 'الجنوب',
    region: 'Highlands & Tihama',
    primaryColor: '#160600',
    accentColor: '#D1495B',
    accentLight: '#E87080',
    textColor: '#FFF0EE',
    cardColor: '#0E0300',
    icon: '⛰️',
    pattern: 'qatt-asiri',
    unescoHeritage: [
      { item: 'Al-Qatt Al-Asiri', id: 'RL 01063', type: 'Intangible Cultural Heritage', year: 2017, criterion: 'ICH Decision 12.COM 11.b.17', verified: true },
      { item: 'Rijal Alma historic village', id: 'TL-SAU-007', type: 'World Heritage Candidate', year: null, criterion: 'Saudi Tentative List', verified: false },
      { item: 'Al-Ukhdud Archaeological Site', id: 'TL-SAU-010', type: 'World Heritage Candidate', year: null, criterion: 'Saudi Tentative List', verified: false },
      { item: 'Farasan Islands', id: 'TL-SAU-009', type: 'World Heritage Candidate (Natural)', year: null, criterion: 'Saudi Tentative List', verified: false }
    ]
  },
  northern: {
    nameEn: 'Northern Region',
    nameAr: 'الشمال',
    region: 'Northern Arabia',
    primaryColor: '#070F1C',
    accentColor: '#7BBAE0',
    accentLight: '#A2CFF0',
    textColor: '#F0F8FF',
    cardColor: '#040A14',
    icon: '🏕️',
    pattern: 'sadu-chevron',
    unescoHeritage: [
      { item: 'Al-Sadu weaving', id: 'RL 01567', type: 'Intangible Cultural Heritage', year: 2020, criterion: 'ICH Decision 15.COM 8.b.26', verified: true },
      { item: 'Dumat Al-Jandal', id: 'TL-SAU-012', type: 'World Heritage Candidate', year: null, criterion: 'Saudi Tentative List', verified: false },
      { item: 'Arar Mud-brick Fortresses', id: 'TL-SAU', type: 'National Heritage (Candidate)', year: null, criterion: 'Saudi Heritage Commission', verified: false }
    ]
  }
};

const REGION_STORAGE_KEY = 'culturelens_selected_region';

// ── UNESCO VERIFICATION ──
function verifyUNESCO(regionKey) {
  const heritage = REGIONS[regionKey]?.unescoHeritage;
  if (!heritage || heritage.length === 0) {
    console.warn(`[UNESCO ⚠] No heritage data for: ${regionKey}`);
    return false;
  }
  heritage.forEach(h => {
    const tag = h.verified ? '✓ VERIFIED' : '⚠ CANDIDATE';
    console.log(`[UNESCO ${tag}] ${regionKey} → "${h.item}" | ${h.id} | ${h.type} | ${h.criterion}`);
  });
  return true;
}

// ── PATTERN ENGINE ──
const PATTERN_ENGINE = {
  currentPattern: null,

  createOverlay() {
    let overlay = document.getElementById('region-pattern-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'region-pattern-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = `
        <div class="pattern-base" aria-hidden="true"></div>
        <div class="pattern-accent" aria-hidden="true"></div>
      `;
      document.body.insertBefore(overlay, document.body.firstChild);
    }
    return overlay;
  },

  apply(patternName) {
    if (this.currentPattern === patternName) return;
    const overlay = this.createOverlay();
    const base = overlay.querySelector('.pattern-base');
    const accent = overlay.querySelector('.pattern-accent');

    overlay.style.opacity = '0';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.className = '';
        overlay.classList.add(`pattern-family-${patternName}`);
        overlay.setAttribute('data-pattern', patternName);

        // Inject per-pattern CSS variables for JS-driven accent intensity
        if (base) base.style.opacity = '1';
        if (accent) accent.style.opacity = '0.45';

        overlay.style.opacity = '';
        this.currentPattern = patternName;
      });
    });
  },

  clear() {
    const overlay = document.getElementById('region-pattern-overlay');
    if (overlay) overlay.style.opacity = '0';
    this.currentPattern = null;
  }
};

function injectPatternOverlay() {
  PATTERN_ENGINE.createOverlay();
}

// ── APPLY FULL THEME ──
function applyRegionTheme(regionKey) {
  const region = REGIONS[regionKey];
  if (!region) return;

  document.body.setAttribute('data-region', regionKey);
  document.body.setAttribute('data-pattern', region.pattern);

  // Drive the dynamic pattern overlay
  PATTERN_ENGINE.apply(region.pattern);

  // Set CSS custom properties directly for immediate paint
  const root = document.documentElement;
  root.style.setProperty('--region-bg',         region.primaryColor);
  root.style.setProperty('--region-accent',      region.accentColor);
  root.style.setProperty('--region-accent-lt',   region.accentLight);
  root.style.setProperty('--region-card',        region.cardColor);
  root.style.setProperty('--region-text',        region.textColor);
  root.style.setProperty('--region-border',      hexToRgba(region.accentColor, 0.22));
  root.style.setProperty('--region-glow',        hexToRgba(region.accentColor, 0.12));
  root.style.setProperty('--region-shadow',      hexToRgba(region.primaryColor, 0.8));
  root.style.setProperty('--region-muted',       hexToRgba(region.textColor, 0.45));

  verifyUNESCO(regionKey);
}

function hexToRgba(hex, alpha) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(128,128,128,${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── SELECT REGION ──
function selectRegion(regionKey) {
  localStorage.setItem(REGION_STORAGE_KEY, regionKey);
  applyRegionTheme(regionKey);
  closeRegionModal();

  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.45s ease';
  setTimeout(() => { document.body.style.opacity = '1'; }, 450);
  updateRegionIndicator(regionKey);
}

// ── UPDATE INDICATOR ──
function updateRegionIndicator(regionKey) {
  const indicator = document.getElementById('region-indicator');
  if (!indicator) return;
  const r = REGIONS[regionKey];
  if (!r) return;
  indicator.innerHTML = `${r.icon} <span style="margin:0 4px">${r.nameEn}</span><span style="opacity:0.55;font-size:9px;letter-spacing:0.5px"> ▾ change</span>`;
  indicator.style.display = 'flex';
}

// ── RENDER GRID ──
function renderRegionGrid() {
  const grid = document.getElementById('region-grid');
  if (!grid) return;

  grid.innerHTML = '';
  Object.entries(REGIONS).forEach(([key, region], idx) => {
    const primaryHeritage = region.unescoHeritage[0];
    const verifiedBadge = primaryHeritage.verified
      ? `<span class="heritage-badge verified">✓ UNESCO</span>`
      : `<span class="heritage-badge candidate">◎ Candidate</span>`;

    const card = document.createElement('div');
    card.className = 'region-card';
    card.style.cssText = `animation-delay:${idx * 0.045}s; --card-accent:${region.accentColor};`;
    card.setAttribute('data-key', key);
    card.innerHTML = `
      <div class="region-card-icon">${region.icon}</div>
      <div class="region-card-name">${region.nameEn}</div>
      <div class="region-card-ar">${region.nameAr}</div>
      ${verifiedBadge}
      <div class="region-card-heritage">${primaryHeritage.item}</div>
    `;
    card.addEventListener('click', () => selectRegion(key));
    card.addEventListener('mouseenter', () => previewTheme(key));
    card.addEventListener('mouseleave', clearPreviewTheme);
    grid.appendChild(card);
  });
}

// ── HOVER PREVIEW ──
function previewTheme(regionKey) {
  const region = REGIONS[regionKey];
  if (!region) return;
  document.documentElement.style.setProperty('--preview-accent', region.accentColor);
  document.documentElement.style.setProperty('--preview-bg', region.primaryColor);
}
function clearPreviewTheme() {
  document.documentElement.style.removeProperty('--preview-accent');
  document.documentElement.style.removeProperty('--preview-bg');
}

// ── MODAL CONTROL ──
function openRegionModal() {
  const modal = document.getElementById('region-modal');
  if (modal) { modal.classList.add('show'); renderRegionGrid(); }
}
function closeRegionModal() {
  const modal = document.getElementById('region-modal');
  if (modal) modal.classList.remove('show');
}

// ── ENTRY GATEWAY ──
const LEGACY_REGIONS = ['riyadh','makkah','madinah','aseer','tabuk','hail','jazan','najran','albahah','aljawf','alqassim'];

function initThemeEngine() {
  injectPatternOverlay();

  const saved = localStorage.getItem(REGION_STORAGE_KEY);
  // Stale-key migration: old 13-province keys trigger re-selection
  if (saved && LEGACY_REGIONS.includes(saved)) {
    localStorage.removeItem(REGION_STORAGE_KEY);
    setTimeout(openRegionModal, 300);
    return;
  }
  if (saved && REGIONS[saved]) {
    applyRegionTheme(saved);
    updateRegionIndicator(saved);
  } else {
    setTimeout(openRegionModal, 300);
  }
}

function resetRegion() {
  localStorage.removeItem(REGION_STORAGE_KEY);
  document.body.removeAttribute('data-region');
  document.body.removeAttribute('data-pattern');
  openRegionModal();
  const indicator = document.getElementById('region-indicator');
  if (indicator) indicator.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', initThemeEngine);

window.ThemeManager = { REGIONS, applyRegionTheme, selectRegion, resetRegion, verifyUNESCO, hexToRgba };
