// Comparing what a learner sang with the line they were answering: Arabic spelling is normalized (no
// diacritics, one alef, ya/alef maqsura, ta marbuta/ha), then the two word lists are aligned with an edit
// distance where near-misses (a letter or two off, the way Najdi speech spells out) count as partly right.

const DIAC = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

export function norm(s: string): string {
  return (s || '')
    .replace(DIAC, '')
    .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^ء-يa-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}

export function words(s: string): string[] { const n = norm(s); return n ? n.split(' ') : []; }

function lev(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

// 1 for the same word, down to 0; the article al- is not worth a mismatch on its own
export function wordSim(a: string, b: string): number {
  const strip = (w: string) => w.replace(/^(وال|بال|فال|كال|لل|ال|و)/, '');
  const x = strip(a), y = strip(b);
  const d = Math.min(lev(a, b), lev(x, y));
  const L = Math.max(x.length, y.length, 1);
  return Math.max(0, 1 - d / L);
}

export type Alignment = { expected: string[]; heard: string[]; pairs: { exp: string | null; got: string | null; sim: number }[]; accuracy: number; matched: number; missed: string[]; extra: string[] };

// Needleman-Wunsch style: substitution costs 1 - similarity, a missing or extra word costs 1
export function align(expectedText: string, heardText: string): Alignment {
  const E = words(expectedText), H = words(heardText);
  const m = E.length, n = H.length;
  const D: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  const B: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) { D[i][0] = i; B[i][0] = 1; }
  for (let j = 1; j <= n; j++) { D[0][j] = j; B[0][j] = 2; }
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const s = wordSim(E[i - 1], H[j - 1]);
    const sub = D[i - 1][j - 1] + (1 - s), del = D[i - 1][j] + 1, ins = D[i][j - 1] + 1;
    const best = Math.min(sub, del, ins);
    D[i][j] = best; B[i][j] = best === sub ? 0 : best === del ? 1 : 2;
  }
  const pairs: Alignment['pairs'] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    const b = i > 0 && j > 0 ? B[i][j] : i > 0 ? 1 : 2;
    if (b === 0) { pairs.unshift({ exp: E[i - 1], got: H[j - 1], sim: wordSim(E[i - 1], H[j - 1]) }); i--; j--; }
    else if (b === 1) { pairs.unshift({ exp: E[i - 1], got: null, sim: 0 }); i--; }
    else { pairs.unshift({ exp: null, got: H[j - 1], sim: 0 }); j--; }
  }
  let credit = 0, matched = 0;
  const missed: string[] = [], extra: string[] = [];
  for (const p of pairs) {
    if (p.exp && p.got) { const c = p.sim >= 0.75 ? 1 : p.sim >= 0.5 ? 0.5 : 0; credit += c; if (c === 1) matched++; else missed.push(p.exp); }
    else if (p.exp) missed.push(p.exp);
    else if (p.got) extra.push(p.got);
  }
  return { expected: E, heard: H, pairs, accuracy: m ? credit / m : 0, matched, missed, extra };
}

// when each expected word was sung, against when it should have started (seconds from the start of the turn)
export function wordTiming(expectedText: string, expectedStarts: number[], heard: { w: string; s: number }[], offset = 0) {
  const E = words(expectedText);
  if (!E.length || !heard.length || expectedStarts.length !== E.length) return null;
  const used = new Set<number>();
  const offs: number[] = [];
  E.forEach((w, k) => {
    let best = -1, bs = 0.5;
    heard.forEach((h, j) => { if (used.has(j)) return; const s = wordSim(w, norm(h.w)); if (s > bs) { bs = s; best = j; } });
    if (best >= 0) { used.add(best); offs.push((heard[best].s - offset) - expectedStarts[k]); }
  });
  if (!offs.length) return null;
  const mean = offs.reduce((a, b) => a + b, 0) / offs.length;
  return { words_timed: offs.length, mean_offset_ms: Math.round(mean * 1000), on_time: offs.filter((o) => Math.abs(o) < 0.35).length };
}
