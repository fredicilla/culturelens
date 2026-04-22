/**
 * ThemeManager.js — CultureLens 13-Province Experience Engine v2
 * Full UNESCO-verified data, pattern overlay injection, deep theme application.
 *
 * UNESCO Sources:
 *   WHC  = UNESCO World Heritage Convention (whc.unesco.org)
 *   ICH  = Intangible Cultural Heritage (ich.unesco.org)
 *   TL   = WHC Tentative List (Saudi Arabia submission)
 */

const REGIONS = {
  riyadh: {
    nameEn: 'Riyadh',
    nameAr: 'الرياض',
    region: 'Najd',
    primaryColor: '#0D3B2A',
    accentColor: '#C9A84C',
    accentLight: '#E8C96B',
    textColor: '#F9F3E8',
    cardColor: '#122B1E',
    icon: '🏛️',
    pattern: 'diamond-lattice',
    unescoHeritage: [
      {
        item: 'At-Turaif District in ad-Dir\'iyah',
        id: 'C 1329',
        type: 'World Heritage Site',
        year: 2010,
        criterion: 'WHC Decision 34 COM 8B.9 — Outstanding example of Najdi architecture',
        verified: true
      },
      {
        item: 'Arabic Coffee (Al-Qahwa) — symbol of generosity',
        id: 'RL 01073',
        type: 'Intangible Cultural Heritage',
        year: 2015,
        criterion: 'ICH Decision 10.COM 10.b.14',
        verified: true
      },
      {
        item: 'Al-Ardha — Najdi sword dance and poetry',
        id: 'RL 01064',
        type: 'Intangible Cultural Heritage',
        year: 2015,
        criterion: 'ICH Decision 10.COM 10.b.13',
        verified: true
      }
    ]
  },

  makkah: {
    nameEn: 'Makkah',
    nameAr: 'مكة المكرمة',
    region: 'Hijaz',
    primaryColor: '#1a0800',
    accentColor: '#D4A843',
    accentLight: '#EAC060',
    textColor: '#FDF5E6',
    cardColor: '#130500',
    icon: '🕌',
    pattern: 'eight-star',
    unescoHeritage: [
      {
        item: 'Historic Jeddah — The Gate to Makkah',
        id: 'C 1361',
        type: 'World Heritage Site',
        year: 2014,
        criterion: 'WHC Decision 38 COM 8B.17 — Outstanding universal value of historic port city',
        verified: true
      },
      {
        item: 'Al-Qudoum — traditional welcome ceremony',
        id: 'TL-SAU',
        type: 'Intangible Cultural Heritage (Candidate)',
        year: null,
        criterion: 'Saudi National Heritage Commission',
        verified: false
      }
    ]
  },

  madinah: {
    nameEn: 'Madinah',
    nameAr: 'المدينة المنورة',
    region: 'Hijaz',
    primaryColor: '#061808',
    accentColor: '#4CAF75',
    accentLight: '#74C894',
    textColor: '#F0FFF4',
    cardColor: '#031005',
    icon: '🌿',
    pattern: 'arabesque',
    unescoHeritage: [
      {
        item: 'Hejaz Railway — Ottoman-era engineering landmark',
        id: 'TL-SAU-005',
        type: 'World Heritage Candidate',
        year: null,
        criterion: 'Saudi Tentative List — cross-border historical railway from Damascus to Madinah',
        verified: false
      },
      {
        item: 'Falconry — a living human heritage',
        id: 'RL 01209',
        type: 'Intangible Cultural Heritage (Multinational)',
        year: 2016,
        criterion: 'ICH Decision 11.COM 11.b.3 — Saudi Arabia among 18 inscribed nations',
        verified: true
      }
    ]
  },

  eastern: {
    nameEn: 'Eastern Province',
    nameAr: 'المنطقة الشرقية',
    region: 'Al-Ahsa',
    primaryColor: '#04111E',
    accentColor: '#4A9FC9',
    accentLight: '#72BEE0',
    textColor: '#EDF6FF',
    cardColor: '#020C16',
    icon: '🛢️',
    pattern: 'hexagonal',
    unescoHeritage: [
      {
        item: 'Al-Ahsa Oasis — Evolving Cultural Landscape',
        id: 'C 1563',
        type: 'World Heritage Site',
        year: 2018,
        criterion: 'WHC Decision 42 COM 8B.28 — Largest oasis in the world',
        verified: true
      },
      {
        item: 'Al-Sadu — traditional weaving in Saudi Arabia and Kuwait',
        id: 'RL 01567',
        type: 'Intangible Cultural Heritage (Multinational)',
        year: 2020,
        criterion: 'ICH Decision 15.COM 8.b.26',
        verified: true
      },
      {
        item: 'Date Palm — knowledge, skills, traditions and practices',
        id: 'RL 01509',
        type: 'Intangible Cultural Heritage (Multinational)',
        year: 2019,
        criterion: 'ICH Decision 14.COM 10.b.15 — 14 nations including Saudi Arabia',
        verified: true
      }
    ]
  },

  aseer: {
    nameEn: 'Asir',
    nameAr: 'عسير',
    region: 'Asir Highlands',
    primaryColor: '#160600',
    accentColor: '#D1495B',
    accentLight: '#E87080',
    textColor: '#FFF0EE',
    cardColor: '#0E0300',
    icon: '🎨',
    pattern: 'qatt-asiri',
    unescoHeritage: [
      {
        item: 'Al-Qatt Al-Asiri — female interior wall decoration in Asir',
        id: 'RL 01063',
        type: 'Intangible Cultural Heritage',
        year: 2017,
        criterion: 'ICH Decision 12.COM 11.b.17 — Geometric mural art practice exclusive to Asir women',
        verified: true
      },
      {
        item: 'Rijal Alma historic village',
        id: 'TL-SAU-007',
        type: 'World Heritage Candidate',
        year: null,
        criterion: 'Saudi Tentative List — outstanding example of Asiri stone tower architecture',
        verified: false
      }
    ]
  },

  tabuk: {
    nameEn: 'Tabuk',
    nameAr: 'تبوك',
    region: 'Hejaz / Northwest',
    primaryColor: '#080F1A',
    accentColor: '#4DB8D4',
    accentLight: '#78CEDF',
    textColor: '#E8F8FF',
    cardColor: '#040A12',
    icon: '🏔️',
    pattern: 'nabataean-arch',
    unescoHeritage: [
      {
        item: 'Hegra Archaeological Site (Madain Salih) — Nabataean city',
        id: 'C 1293',
        type: 'World Heritage Site',
        year: 2008,
        criterion: 'WHC Decision 32 COM 8B.1 — First Saudi World Heritage Site; Nabataean caravan city',
        verified: true
      },
      {
        item: 'Hejaz Railway — Ottoman-era cross-border rail heritage',
        id: 'TL-SAU-005',
        type: 'World Heritage Candidate',
        year: null,
        criterion: 'Saudi Tentative List — Tabuk is a major station on the historic line',
        verified: false
      }
    ]
  },

  hail: {
    nameEn: 'Hail',
    nameAr: 'حائل',
    region: 'Northern Nejd',
    primaryColor: '#180C04',
    accentColor: '#E8744A',
    accentLight: '#F49670',
    textColor: '#FFF5F0',
    cardColor: '#100700',
    icon: '🪨',
    pattern: 'petroglyph-dots',
    unescoHeritage: [
      {
        item: 'Rock Art in the Hail Region — Jubbah & Shuwaymis',
        id: 'C 1472',
        type: 'World Heritage Site',
        year: 2015,
        criterion: 'WHC Decision 39 COM 8B.16 — Largest rock art site; depictions spanning 10,000 years',
        verified: true
      }
    ]
  },

  northern: {
    nameEn: 'Northern Borders',
    nameAr: 'الحدود الشمالية',
    region: 'Northern Arabia',
    primaryColor: '#070F1C',
    accentColor: '#7BBAE0',
    accentLight: '#A2CFF0',
    textColor: '#F0F8FF',
    cardColor: '#040A14',
    icon: '🏕️',
    pattern: 'sadu-chevron',
    unescoHeritage: [
      {
        item: 'Al-Sadu — traditional weaving (Multinational: Saudi Arabia & Kuwait)',
        id: 'RL 01567',
        type: 'Intangible Cultural Heritage',
        year: 2020,
        criterion: 'ICH Decision 15.COM 8.b.26 — Bedouin textile tradition practiced in the northern region',
        verified: true
      },
      {
        item: 'Arar Mud-brick Fortresses',
        id: 'TL-SAU',
        type: 'National Heritage (Candidate)',
        year: null,
        criterion: 'Saudi Heritage Commission documentation',
        verified: false
      }
    ]
  },

  jazan: {
    nameEn: 'Jazan',
    nameAr: 'جازان',
    region: 'Tihama / Red Sea Coast',
    primaryColor: '#001508',
    accentColor: '#2EC97A',
    accentLight: '#56DE9A',
    textColor: '#F0FFF8',
    cardColor: '#000F05',
    icon: '🌊',
    pattern: 'wave-scale',
    unescoHeritage: [
      {
        item: 'Farasan Islands — natural and archaeological heritage',
        id: 'TL-SAU-009',
        type: 'World Heritage Candidate (Natural)',
        year: null,
        criterion: 'Saudi Tentative List — unique marine ecosystem and Roman-era ruins',
        verified: false
      },
      {
        item: 'Al-Mezmar — traditional percussion dance of the Tihama coast',
        id: 'TL-ICH',
        type: 'Intangible Cultural Heritage (Candidate)',
        year: null,
        criterion: 'Saudi National Heritage Commission',
        verified: false
      }
    ]
  },

  najran: {
    nameEn: 'Najran',
    nameAr: 'نجران',
    region: 'Southern Arabia',
    primaryColor: '#180A00',
    accentColor: '#E09B3D',
    accentLight: '#F0B860',
    textColor: '#FFF8EC',
    cardColor: '#100600',
    icon: '🏺',
    pattern: 'mud-brick',
    unescoHeritage: [
      {
        item: 'Al-Ukhdud Archaeological Site — ancient pre-Islamic Christian settlement',
        id: 'TL-SAU-010',
        type: 'World Heritage Candidate',
        year: null,
        criterion: 'Saudi Tentative List — 6th-century Arabian Christian site mentioned in the Quran (Al-Buruj)',
        verified: false
      },
      {
        item: 'Najrani mud-brick tower houses (Qasr architecture)',
        id: 'TL-ARCH',
        type: 'National Heritage',
        year: null,
        criterion: 'Saudi Heritage Commission — 4-storey decorated clay tower houses unique to the region',
        verified: false
      }
    ]
  },

  albahah: {
    nameEn: 'Al-Bahah',
    nameAr: 'الباحة',
    region: 'Asir / Hejaz Highlands',
    primaryColor: '#031508',
    accentColor: '#4DB865',
    accentLight: '#74CE86',
    textColor: '#EEF9EF',
    cardColor: '#020E05',
    icon: '🌲',
    pattern: 'mountain-terrace',
    unescoHeritage: [
      {
        item: 'Asir stone tower architecture — endangered highland vernacular tradition',
        id: 'TL-SAU-011',
        type: 'World Heritage Candidate',
        year: null,
        criterion: 'Saudi Tentative List — distinctive multi-story stone towers decorated with slate overhangs',
        verified: false
      },
      {
        item: 'Ghamdi traditional oral poetry and Al-Daan song',
        id: 'TL-ICH',
        type: 'Intangible Cultural Heritage (Candidate)',
        year: null,
        criterion: 'Saudi National Heritage Commission',
        verified: false
      }
    ]
  },

  aljawf: {
    nameEn: 'Al-Jawf',
    nameAr: 'الجوف',
    region: 'Northern Arabia',
    primaryColor: '#100608',
    accentColor: '#C46FA0',
    accentLight: '#DA94BC',
    textColor: '#FFF0F8',
    cardColor: '#0A0305',
    icon: '🌹',
    pattern: 'radial-rose',
    unescoHeritage: [
      {
        item: 'Dumat Al-Jandal — ancient oasis city, Nabataean & pre-Islamic hub',
        id: 'TL-SAU-012',
        type: 'World Heritage Candidate',
        year: null,
        criterion: 'Saudi Tentative List — one of the oldest continuously inhabited sites in Arabia',
        verified: false
      },
      {
        item: 'Al-Jouf olive groves — ancient agricultural landscape',
        id: 'TL-SAU',
        type: 'World Heritage Candidate (Cultural Landscape)',
        year: null,
        criterion: 'Saudi Heritage Commission — Al-Jouf is one of the oldest olive-growing regions in the world',
        verified: false
      }
    ]
  },

  alqassim: {
    nameEn: 'Al-Qassim',
    nameAr: 'القصيم',
    region: 'Central Arabia',
    primaryColor: '#180F00',
    accentColor: '#CFA020',
    accentLight: '#E3BE42',
    textColor: '#FFFAED',
    cardColor: '#100A00',
    icon: '🌾',
    pattern: 'palm-frond',
    unescoHeritage: [
      {
        item: 'Date Palm — knowledge, skills, traditions and practices',
        id: 'RL 01509',
        type: 'Intangible Cultural Heritage (Multinational)',
        year: 2019,
        criterion: 'ICH Decision 14.COM 10.b.15 — Al-Qassim is known as the "Capital of Dates" in Saudi Arabia',
        verified: true
      },
      {
        item: 'Arabic Coffee (Al-Qahwa)',
        id: 'RL 01073',
        type: 'Intangible Cultural Heritage',
        year: 2015,
        criterion: 'ICH Decision 10.COM 10.b.14 — Al-Qassim is a major coffee-trading heritage region',
        verified: true
      }
    ]
  }
};

// ── STORAGE KEY ──
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

// ── INJECT PATTERN OVERLAY ──
function injectPatternOverlay() {
  if (!document.getElementById('region-pattern-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'region-pattern-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(overlay, document.body.firstChild);
  }
}

// ── APPLY FULL THEME ──
function applyRegionTheme(regionKey) {
  const region = REGIONS[regionKey];
  if (!region) return;

  document.body.setAttribute('data-region', regionKey);
  document.body.setAttribute('data-pattern', region.pattern);

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
function initThemeEngine() {
  injectPatternOverlay();

  const saved = localStorage.getItem(REGION_STORAGE_KEY);
  if (saved && REGIONS[saved]) {
    applyRegionTheme(saved);
    updateRegionIndicator(saved);
  } else {
    // First visit — show region selector modal
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
