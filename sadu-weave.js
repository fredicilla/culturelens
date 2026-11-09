/**
 * sadu-weave.js — Al-Sadu bands, drawn in code.
 *
 * A Sadu band is warp-faced: the pattern lives in the lengthwise (warp) threads.
 * Here a band is a grid: one column per warp thread, one row per pass of the weft.
 * Every cell holds a yarn color. drawBand() paints the grid as woven cloth:
 * short rounded floats, staggered between neighboring threads like a plain weave.
 *
 * Colors: the traditional Sadu colors are black, white, brown, beige and red
 * (black from goat hair, white from sheep's wool, browns from camel hair), with
 * reds and oranges from dyes.
 * Patterns, by their names in Sadu: the tree (الشجرة), horse teeth (أسنان الخيل),
 * the grains (الحبوب), the chain of rings (الحلقات المتداخلة), camels (الإبل).
 */

export const YARN = {
  black:  { hex: '#221A17', en: 'Black',  ar: 'أسود', arDef: 'الأسود',   dyed: false, from: { en: 'goat hair', ar: 'شعر الماعز' } },
  white:  { hex: '#EEE5D2', en: 'White',  ar: 'أبيض', arDef: 'الأبيض',   dyed: false, from: { en: 'the wool of white sheep', ar: 'صوف الغنم البيض' } },
  brown:  { hex: '#7B4B2E', en: 'Brown',  ar: 'بني', arDef: 'البني',    dyed: false, from: { en: 'camel hair', ar: 'وبر الإبل' } },
  beige:  { hex: '#C8A47B', en: 'Beige',  ar: 'بيج', arDef: 'البيج',    dyed: false, from: { en: 'camel hair', ar: 'وبر الإبل' } },
  red:    { hex: '#A4252C', en: 'Red',    ar: 'أحمر', arDef: 'الأحمر',   dyed: true,  from: { en: 'a plant dye', ar: 'صبغ من النبات' } },
  orange: { hex: '#D0682A', en: 'Orange', ar: 'برتقالي', arDef: 'البرتقالي', dyed: true,  from: { en: 'a plant dye', ar: 'صبغ من النبات' } }
};
export const YARN_KEYS = Object.keys(YARN);

// ── the patterns ── ('#' = pattern yarn, '.' = ground yarn)
const SPRITES = {
  tree: [
    '.......#.......',
    '......###......',
    '.....#.#.#.....',
    '....#..#..#....',
    '...#...#...#...',
    '.......#.......',
    '......###......',
    '.....#.#.#.....',
    '....#..#..#....',
    '...#...#...#...',
    '..#....#....#..',
    '.......#.......',
    '......###......',
    '.....#.#.#.....',
    '....#..#..#....',
    '...#...#...#...',
    '..#....#....#..',
    '.#.....#.....#.',
    '.......#.......',
    '......###......',
    '.......#.......'
  ],
  chain: [
    '.......#.......',
    '......#.#......',
    '.....#...#.....',
    '....#..#..#....',
    '...#..#.#..#...',
    '..#..#...#..#..',
    '...#..#.#..#...',
    '....#..#..#....',
    '.....#...#.....',
    '......#.#......'
  ],
  camels: [
    '...............',
    '...........##..',
    '..........####.',
    '..........##...',
    '....##....##...',
    '...####...##...',
    '..######.##....',
    '.##########....',
    '.##########....',
    '..########.....',
    '..##....##.....',
    '..#.#...#.#....',
    '..#.#...#.#....',
    '..#.#...#.#....',
    '...............'
  ]
};
// Patterns as they should look on a band shown lying across (dir 'h'). These are drawn
// upright on screen and turned into warp order by uprightSprite().
const SPRITES_UP = {
  tree: [
    '......#......',
    '.....###.....',
    '....#.#.#....',
    '...#..#..#...',
    '......#......',
    '....#.#.#....',
    '...#..#..#...',
    '..#...#...#..',
    '......#......',
    '...#..#..#...',
    '..#...#...#..',
    '.#....#....#.',
    '......#......',
    '.....###.....',
    '....#####....'
  ],
  camels: null   // the camel is already drawn upright
};
// rows of empty ground between repeats
const GAP = { tree: 3, chain: 0, camels: 3 };

export const CENTERS = ['tree', 'chain', 'camels'];
export const EDGES = ['teeth', 'grains', 'stripes'];

export const NAMES = {
  tree:    { en: 'The tree', ar: 'الشجرة' },
  chain:   { en: 'The chain of rings', ar: 'الحلقات المتداخلة' },
  camels:  { en: 'Camels', ar: 'الإبل' },
  teeth:   { en: 'Horse teeth', ar: 'أسنان الخيل' },
  grains:  { en: 'The grains', ar: 'الحبوب' },
  stripes: { en: 'Plain stripes', ar: 'خطوط سادة' }
};

// column layout: | border 3 | edge 4 | line 1 | center 15 | line 1 | edge 4 | border 3 |
export const COLS = 31;
const EDGE_W = 4, BORDER_W = 3, CENTER_W = 15;
const X_EDGE_L = BORDER_W, X_LINE_L = BORDER_W + EDGE_W, X_CENTER = X_LINE_L + 1;
const X_LINE_R = X_CENTER + CENTER_W, X_EDGE_R = X_LINE_R + 1;
export const ZONES = {
  borderL: [0, BORDER_W], edgeL: [X_EDGE_L, X_EDGE_L + EDGE_W], center: [X_CENTER, X_CENTER + CENTER_W],
  edgeR: [X_EDGE_R, X_EDGE_R + EDGE_W], borderR: [X_EDGE_R + EDGE_W, COLS]
};

/**
 * spec = { edge, center, ground, figure }  (yarn keys for ground/figure)
 * Returns { W, R, cells: Uint8Array of indices into YARN_KEYS, warp: base color per column }
 */
function uprightSprite(screen) {
  // band (sx, sy) shows at screen (row CENTER_W - 1 - sx, column sy) when the band lies across
  const out = [], w = screen[0].length, h = screen.length, pad = Math.floor((CENTER_W - h) / 2);
  for (let sy = 0; sy < w; sy++) {
    let row = '';
    for (let sx = 0; sx < CENTER_W; sx++) { const r = CENTER_W - 1 - sx - pad; row += (r >= 0 && r < h && screen[r][sy] === '#') ? '#' : '.'; }
    out.push(row);
  }
  return out;
}
const UP_CACHE = {};
function spriteFor(center, upright) {
  if (!upright || center === 'chain') return SPRITES[center];
  if (!UP_CACHE[center]) UP_CACHE[center] = uprightSprite(SPRITES_UP[center] || SPRITES[center]);
  return UP_CACHE[center];
}

/**
 * opts.upright  patterns read upright when the band lies across (dir 'h')
 * opts.flip     patterns read upright from the weaver's end of the loom
 * opts.lead     plain rows (no center pattern) before the first repeat
 */
export function bandGrid(spec, rows, opts) {
  opts = opts || {};
  const lead = opts.lead || 0;
  const W = COLS, R = rows, cells = new Uint8Array(W * R);
  const G = YARN_KEYS.indexOf(spec.ground), F = YARN_KEYS.indexOf(spec.figure);
  const black = YARN_KEYS.indexOf('black'), white = YARN_KEYS.indexOf('white');
  // the outer borders: a narrow stripe of the ground color between dark stripes
  const accent = spec.ground === 'black' ? YARN_KEYS.indexOf('red') : black;
  const border = [accent, F, G];
  const sprite = spriteFor(spec.center, opts.upright), sh = sprite.length + (GAP[spec.center] || 0);
  for (let y = 0; y < R; y++) {
    for (let x = 0; x < W; x++) {
      let c = G;
      if (x < X_EDGE_L) c = border[x];
      else if (x >= X_EDGE_R + EDGE_W) c = border[W - 1 - x];
      else if (x === X_LINE_L || x === X_LINE_R) c = F;
      else if (x < X_LINE_L || x > X_LINE_R) {
        const ex = x < X_LINE_L ? x - X_EDGE_L : X_EDGE_R + EDGE_W - 1 - x;   // 0..3, mirrored
        c = edgeCell(spec.edge, ex, y, F, G, black, white);
      } else if (y < lead) {
        c = G;
      } else {
        const sx = x - X_CENTER, sy = (y - lead) % sh;
        const line = sy < sprite.length ? sprite[opts.flip ? sprite.length - 1 - sy : sy] : null;
        c = (line && line[sx] === '#') ? F : G;
      }
      cells[y * W + x] = c;
    }
  }
  const warp = [];
  for (let x = 0; x < W; x++) warp.push(cells[x]);
  return { W: W, R: R, cells: cells, spec: spec };
}

function edgeCell(edge, ex, y, F, G, black, white) {
  if (edge === 'teeth') {
    // small squares in a row, like a horse's square teeth
    const a = ((ex >> 1) + (y >> 1)) & 1;
    return a ? F : (G === black ? white : black);
  }
  if (edge === 'grains') {
    // a long white strip with points like grains
    if (ex === 0 || ex === 3) return G;
    const dot = (ex === 1 && y % 4 === 0) || (ex === 2 && y % 4 === 2);
    return dot ? (G === white ? black : G) : white;
  }
  // plain stripes
  return ex % 2 === 0 ? F : G;
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (k >= 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
  return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
}

// tiny repeatable noise so every float looks a little different
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

/**
 * Paint a band.
 *   ctx      2D context
 *   grid     from bandGrid()
 *   o.cw/ch  size of one cell (px)       o.dir 'v' (rows go down) or 'h' (rows go right)
 *   o.woven  how many rows are woven (the rest shows bare warp threads)
 *   o.dim    zone name to keep bright while the rest dims (for questions)
 */
export function drawBand(ctx, grid, o) {
  o = o || {};
  const cw = o.cw || 6, ch = o.ch || 8, W = grid.W, R = grid.R, dir = o.dir || 'v';
  const woven = o.woven == null ? R : Math.max(0, Math.min(R, o.woven));
  const cols = o.cols == null ? W : Math.max(0, Math.min(W, o.cols));
  const ox = o.x || 0, oy = o.y || 0;
  ctx.save();
  ctx.translate(ox, oy);
  // 'h': rows run left to right
  if (dir === 'h') { ctx.translate(0, W * cw); ctx.rotate(-Math.PI / 2); }
  // under everything: the dark of the cloth between floats (o.clear: only under the woven part)
  ctx.fillStyle = '#120D0B';
  if (o.clear) { if (cols > 0) ctx.fillRect(0, 0, cols * cw, woven * ch); }
  else ctx.fillRect(0, 0, W * cw, R * ch);
  // bare warp beyond the woven part: thin threads per column
  for (let x = 0; x < cols; x++) {
    const hex = YARN[YARN_KEYS[grid.cells[x]]].hex;
    if (woven < R) {
      ctx.fillStyle = shade(hex, -0.15);
      ctx.fillRect(x * cw + cw * 0.3, woven * ch, cw * 0.4, (R - woven) * ch);
      ctx.fillStyle = shade(hex, 0.18);
      ctx.fillRect(x * cw + cw * 0.38, woven * ch, cw * 0.12, (R - woven) * ch);
    }
  }
  for (let y = 0; y < woven; y++) {
    for (let x = 0; x < cols; x++) {
      const hex = YARN[YARN_KEYS[grid.cells[y * W + x]]].hex;
      const off = (x & 1) ? ch * 0.5 : 0;
      const n = hash(x, y);
      const px = x * cw + cw * 0.08, w = cw * 0.84;
      for (let part = 0; part < 2; part++) {
        // each float is drawn in two halves so the stagger wraps cleanly within the row
        let top = y * ch + off - (part ? ch : 0), h = ch * 0.92;
        if (top + h < y * ch || top > (y + 1) * ch) continue;
        const t0 = Math.max(top, y * ch), t1 = Math.min(top + h, (y + 1) * ch);
        if (t1 - t0 < 0.5) continue;
        const g = ctx.createLinearGradient(px, 0, px + w, 0);
        g.addColorStop(0, shade(hex, -0.32 - n * 0.06));
        g.addColorStop(0.45, shade(hex, 0.12 + n * 0.08));
        g.addColorStop(1, shade(hex, -0.38));
        ctx.fillStyle = g;
        roundRect(ctx, px, t0, w, t1 - t0, Math.min(w, t1 - t0) * 0.45);
        ctx.fill();
        // the twist of the spun thread
        if (cw >= 5) {
          ctx.strokeStyle = shade(hex, -0.42);
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = Math.max(0.6, cw * 0.09);
          ctx.beginPath();
          for (let k = t0 + ch * 0.18; k < t1 - ch * 0.08; k += ch * 0.34) {
            ctx.moveTo(px + w * 0.18, k); ctx.lineTo(px + w * 0.82, k + ch * 0.16);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
  }
  // the weft line where the weaving stops (the fell)
  if (woven > 0 && woven < R) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, woven * ch - 1, W * cw, 2);
  }
  if (o.dim) {
    const z = ZONES[o.dim];
    const zones = o.dim === 'edges' ? [ZONES.edgeL, ZONES.edgeR] : z ? [z] : [];
    ctx.fillStyle = 'rgba(10,7,6,0.62)';
    let x0 = 0;
    zones.concat([[W, W]]).sort(function (a, b) { return a[0] - b[0]; }).forEach(function (zn) {
      if (zn[0] > x0) ctx.fillRect(x0 * cw, 0, (zn[0] - x0) * cw, woven * ch);
      x0 = Math.max(x0, zn[1]);
    });
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A canvas with a band on it. */
export function bandCanvas(spec, rows, o) {
  o = o || {};
  const cw = o.cw || 6, ch = o.ch || 8, dir = o.dir || 'v';
  const grid = bandGrid(spec, rows, { upright: dir === 'h', flip: o.flip, lead: o.lead });
  const c = document.createElement('canvas');
  const w = dir === 'h' ? rows * ch : COLS * cw, h = dir === 'h' ? COLS * cw : rows * ch;
  const s = o.scale || 1;
  c.width = Math.round(w * s); c.height = Math.round(h * s);
  const ctx = c.getContext('2d');
  ctx.scale(s, s);
  drawBand(ctx, grid, { cw: cw, ch: ch, dir: dir, woven: o.woven, dim: o.dim, cols: o.cols, clear: o.clear });
  c._grid = grid;
  return c;
}

/** Rows needed to show n repeats of the center pattern. */
export function rowsFor(center, n, upright) {
  return (spriteFor(center, upright).length + (GAP[center] || 0)) * n;
}

// the band in the story and the loom: horse teeth on the edges, a tree in the middle, white on red
export const DEMO = { edge: 'teeth', center: 'tree', ground: 'red', figure: 'white' };
