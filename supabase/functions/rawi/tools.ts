// What Rawi can do. Server tools run here and their result goes back to the model (search, memory).
// Client tools are actions for the app (start a drill, weave a band, point at a step): they are checked
// here, sent to the phone with the reply, and the model is told they are queued. A wrong call (a poem that
// does not exist, a yarn the weavers never used) comes back to the model as an error to fix.
import type { ToolDef } from './llm.ts';
import type { Store } from './store.ts';

export type ToolCtx = { store: Store; learnerId: string; experience: string; lang: string; actions: { name: string; args: any }[]; notes: string[] };
type Tool = { def: ToolDef; kind: 'server' | 'client'; needsResult: boolean; run: (a: any, c: ToolCtx) => Promise<any> };

const POEMS: Record<string, number> = { classic: 2, palm: 4, coffee: 4, rain: 4, falcon: 4, night: 4, homeland: 4 };
const YARN = ['black', 'white', 'brown', 'beige', 'red', 'orange'];
const CENTERS = ['tree', 'chain', 'camels'], EDGES = ['teeth', 'grains', 'stripes'];
const PAGES: Record<string, string> = { samri: 'samri.html', qahwa: 'qahwa.html', sadu: 'sadu.html', masaqil: 'masaqeel.html' };
const STEPS = ['roast', 'najr', 'boil', 'coffee', 'brew', 'spices', 'settle', 'pour', 'order', 'hand', 'amount', 'read'];

function fn(name: string, description: string, properties: Record<string, unknown>, required: string[]): ToolDef {
  return { type: 'function', function: { name, description, parameters: { type: 'object', properties, required } } };
}
const short = (s: unknown, n: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

export const TOOLS: Record<string, Tool> = {
  search_heritage: {
    kind: 'server', needsResult: true,
    def: fn('search_heritage', 'Search the CultureLens heritage notes (written and sourced by the team) before stating any heritage fact.',
      { query: { type: 'string', description: 'what to look up, in English keywords' }, experience: { type: 'string', enum: ['samri', 'qahwa', 'sadu', 'masaqil', 'najd'], description: 'limit to one topic (optional); najd is the region: history, places, food, customs' } },
      ['query']),
    async run(a, c) {
      // the guide and the storyteller search everything; an experience searches its own notes unless asked otherwise
      const scope = a.experience || (c.experience === 'general' || c.experience === 'guide' ? null : c.experience);
      const hits = await c.store.search(short(a.query, 200), scope, 3);
      if (!hits.length) return { results: [], note: 'nothing in the notes; do not state facts you cannot support' };
      return { results: hits.map((h) => ({ title: h.title, text: short(c.lang === 'ar' && h.content_ar ? h.content_ar : h.content_en, 420), source: h.source })) };
    },
  },
  remember: {
    kind: 'server', needsResult: false,
    def: fn('remember', 'Keep something about this learner for future visits to any experience.',
      { kind: { type: 'string', enum: ['name', 'likes', 'skill', 'mistake', 'milestone', 'note'] }, note: { type: 'string', description: 'one short sentence' }, importance: { type: 'integer', minimum: 1, maximum: 5 } },
      ['kind', 'note']),
    async run(a, c) {
      const note = short(a.note, 280);
      if (!note) return { ok: false, error: 'empty note' };
      await c.store.remember(c.learnerId, { kind: a.kind || 'note', content: note, importance: Math.max(1, Math.min(5, a.importance | 0 || 2)), experience: c.experience });
      c.notes.push(a.kind + ': ' + note);
      return { ok: true };
    },
  },
  show_card: {
    kind: 'client', needsResult: false,
    def: fn('show_card', 'Show the learner a short card with a heritage fact you just found with search_heritage.',
      { title: { type: 'string' }, text: { type: 'string', description: 'two sentences at most' } }, ['title', 'text']),
    async run(a, c) { c.actions.push({ name: 'show_card', args: { title: short(a.title, 60), text: short(a.text, 280) } }); return { ok: true, queued: true }; },
  },
  suggest_experience: {
    kind: 'client', needsResult: false,
    def: fn('suggest_experience', 'Offer the visitor one of the app\'s experiences that fits what they asked, as a link they can open.',
      { experience: { type: 'string', enum: Object.keys(PAGES) }, why: { type: 'string', description: 'a few words on why it fits' } }, ['experience']),
    async run(a, c) {
      if (!(a.experience in PAGES)) return { ok: false, error: 'experience is one of ' + Object.keys(PAGES).join(', ') };
      c.actions.push({ name: 'suggest_experience', args: { experience: a.experience, page: PAGES[a.experience], why: short(a.why, 120) } });
      return { ok: true, queued: true };
    },
  },
  start_drill: {
    kind: 'client', needsResult: false,
    def: fn('start_drill', 'Start the next Samri drill: the row sings a half-verse and the learner answers it on their tar.',
      {
        poem: { type: 'string', enum: Object.keys(POEMS) },
        half: { type: 'integer', minimum: 0, maximum: 3, description: 'classic has halves 0-1, topic poems 0-3' },
        level: { type: 'integer', minimum: 1, maximum: 4, description: '1: the other row answers first, then the learner, words shown; 2: the learner answers right after the call, words shown; 3: from memory, no words shown; 4: the learner leads the call' },
        style: { type: 'string', enum: ['heavy', 'light'] },
        focus: { type: 'string', enum: ['strikes', 'words', 'both'], description: 'what the learner should pay attention to' },
      }, ['poem', 'half', 'level']),
    async run(a, c) {
      const poem = String(a.poem), half = a.half | 0, level = a.level | 0, style = a.style === 'light' ? 'light' : 'heavy';
      if (!(poem in POEMS)) return { ok: false, error: 'unknown poem; use one of ' + Object.keys(POEMS).join(', ') };
      if (half < 0 || half >= POEMS[poem]) return { ok: false, error: poem + ' has halves 0 to ' + (POEMS[poem] - 1) };
      if (level < 1 || level > 4) return { ok: false, error: 'level is 1 to 4' };
      if (style === 'light' && poem !== 'classic') return { ok: false, error: 'only the classic verse is sung light; use heavy' };
      c.actions.push({ name: 'start_drill', args: { poem, half, level, style, focus: a.focus || 'both' } });
      return { ok: true, queued: true };
    },
  },
  guide_step: {
    kind: 'client', needsResult: false,
    def: fn('guide_step', 'Point the learner at a step of the coffee or of the serving, with a one-sentence tip.',
      { step: { type: 'string', enum: STEPS }, tip: { type: 'string' } }, ['step', 'tip']),
    async run(a, c) {
      if (!STEPS.includes(a.step)) return { ok: false, error: 'step is one of ' + STEPS.join(', ') };
      c.actions.push({ name: 'guide_step', args: { step: a.step, tip: short(a.tip, 160) } }); return { ok: true, queued: true };
    },
  },
  set_fahad_skill: {
    kind: 'client', needsResult: false,
    def: fn('set_fahad_skill', "Set how well you (Fahad) shoot from now on, to keep the match close.",
      { skill: { type: 'number', minimum: 0, maximum: 1 }, why: { type: 'string' } }, ['skill']),
    async run(a, c) {
      const s = Number(a.skill);
      if (!(s >= 0 && s <= 1)) return { ok: false, error: 'skill is a number from 0 to 1' };
      c.actions.push({ name: 'set_fahad_skill', args: { skill: Math.round(s * 100) / 100, why: short(a.why, 120) } }); return { ok: true, queued: true };
    },
  },
  weave_band: {
    kind: 'client', needsResult: false,
    def: fn('weave_band', "Weave the learner's story into Sadu bands (1 to 3), from the real patterns and yarns only.",
      {
        title: { type: 'string', description: 'a short name for the piece' },
        bands: {
          type: 'array', minItems: 1, maxItems: 3,
          items: {
            type: 'object',
            properties: {
              center: { type: 'string', enum: CENTERS }, edge: { type: 'string', enum: EDGES },
              ground: { type: 'string', enum: YARN }, figure: { type: 'string', enum: YARN },
              meaning: { type: 'string', description: 'what this band says about the learner, one sentence said to them (your ..., never my ...)' },
            },
            required: ['center', 'edge', 'ground', 'figure', 'meaning'],
          },
        },
      }, ['title', 'bands']),
    async run(a, c) {
      const bands = Array.isArray(a.bands) ? a.bands.slice(0, 3) : [];
      if (!bands.length) return { ok: false, error: 'give one to three bands' };
      for (const [i, b] of bands.entries()) {
        if (!CENTERS.includes(b.center)) return { ok: false, error: `band ${i + 1}: center is one of ${CENTERS.join(', ')}` };
        if (!EDGES.includes(b.edge)) return { ok: false, error: `band ${i + 1}: edge is one of ${EDGES.join(', ')}` };
        if (!YARN.includes(b.ground) || !YARN.includes(b.figure)) return { ok: false, error: `band ${i + 1}: yarns are ${YARN.join(', ')}` };
        if (b.ground === b.figure) return { ok: false, error: `band ${i + 1}: the pattern needs a different yarn from the ground` };
      }
      c.actions.push({ name: 'weave_band', args: { title: short(a.title, 50), bands: bands.map((b: any) => ({ center: b.center, edge: b.edge, ground: b.ground, figure: b.figure, meaning: short(b.meaning, 160) })) } });
      return { ok: true, queued: true };
    },
  },
};

export function toolDefs(names: string[]): ToolDef[] { return names.filter((n) => TOOLS[n]).map((n) => TOOLS[n].def); }
