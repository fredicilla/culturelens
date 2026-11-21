// Where Rawi keeps things: Postgres on Supabase in production, a plain in-memory store in the tests.

export type Learner = { id: string; device_key: string; lang: string };
export type Session = { id: string; learner_id: string; experience: string; state: Record<string, any>; turns: number };
export type Memory = { kind: string; content: string; importance: number; experience?: string | null; created_at?: string };
export type Attempt = { skill: string; metrics: Record<string, any>; score: number | null; created_at?: string };
export type Passage = { experience: string; title: string; content_en: string; content_ar?: string; source?: string; similarity?: number };

export interface Store {
  learner(deviceKey: string, lang: string): Promise<Learner>;
  session(id: string | undefined, learnerId: string, experience: string): Promise<Session>;
  saveSession(s: Session): Promise<void>;
  memories(learnerId: string, limit: number): Promise<Memory[]>;
  remember(learnerId: string, m: Memory): Promise<void>;
  attempts(learnerId: string, experience: string, limit: number): Promise<Attempt[]>;
  addAttempt(sessionId: string, learnerId: string, experience: string, a: Attempt): Promise<void>;
  trace(row: { session_id: string; experience: string; turn: number; step: number; kind: string; name?: string; payload?: unknown; ms?: number }): Promise<void>;
  search(query: string, experience: string | null, k: number): Promise<Passage[]>;
  turnsToday(learnerId: string): Promise<number>;
}

const env = (k: string, d = '') => (globalThis as any).Deno?.env.get(k) ?? d;

// gte-small runs inside the Edge Runtime itself: free embeddings, no extra service
let embedder: any = null;
export async function embed(text: string): Promise<number[] | null> {
  const S = (globalThis as any).Supabase;
  if (!S?.ai?.Session) return null;
  if (!embedder) embedder = new S.ai.Session('gte-small');
  const v = await embedder.run(text.slice(0, 2000), { mean_pool: true, normalize: true });
  return Array.from(v as ArrayLike<number>);
}

// The heritage notes: the function loads them from the app's own repository (rawi-knowledge.json, the text the team
// wrote and sourced in each experience): all of them when the table is empty, and a whole topic the table does not
// have yet when one is added to the file (only new rows are added, nothing is changed or removed). Then it embeds
// them with gte-small after replies have gone out, a few at a time: the runtime stops an instance that spends more
// than about two seconds of CPU on one request, so a big batch would cut off the visitor's own turn.
let backfilling = false, backfilled = false, synced = false, lastTry = 0;
async function backfill(db: any) {
  if (backfilling || backfilled || Date.now() - lastTry < 20000) return;
  backfilling = true; lastTry = Date.now();
  try {
    if (!synced) {
      const have = await db.from('knowledge').select('experience');
      if (have.error) return;
      synced = true;
      const topics = new Set((have.data || []).map((r: any) => r.experience));
      try {
        const url = env('RAWI_KNOWLEDGE_URL', 'https://raw.githubusercontent.com/fredicilla/culturelens/main/rawi-knowledge.json');
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const rows = res.ok ? await res.json() : [];
        const clean = (Array.isArray(rows) ? rows : []).slice(0, 600).map((k: any) => ({
          experience: String(k.experience || 'general').slice(0, 24), title: String(k.title || '').slice(0, 200),
          content_en: String(k.content_en || '').slice(0, 2000), content_ar: String(k.content_ar || '').slice(0, 2000), source: String(k.source || '').slice(0, 300),
        })).filter((k: any) => k.content_en && !topics.has(k.experience));
        if (clean.length) await db.from('knowledge').insert(clean);
      } catch (_) { /* the repository is out of reach: embed what is there */ }
    }
    const r = await db.from('knowledge').select('id, title, content_en').is('embedding', null).limit(4);
    if (r.error) return;
    if (!r.data?.length) { backfilled = true; return; }
    for (const row of r.data) {
      const v = await embed(row.title + '. ' + row.content_en);
      if (!v) { backfilled = true; return; }      // no embedding model here (local tests)
      await db.from('knowledge').update({ embedding: v }).eq('id', row.id);
    }
  } catch (_) { /* tried again a little later */ } finally { backfilling = false; }
}
export function later(p: Promise<unknown>) {
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(p); else p.catch(() => {});
}

export async function supabaseStore(): Promise<Store> {
  const { createClient } = await import('npm:@supabase/supabase-js@2.45.4');
  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  const must = <T>(r: { data: T; error: any }, what: string): T => { if (r.error) throw new Error(what + ': ' + r.error.message); return r.data; };
  return {
    async learner(deviceKey, lang) {
      later(backfill(db));
      const r = await db.from('learners').upsert({ device_key: deviceKey, lang, last_seen: new Date().toISOString() }, { onConflict: 'device_key' }).select('id, device_key, lang').single();
      return must(r, 'learner') as Learner;
    },
    async session(id, learnerId, experience) {
      if (id) {
        const r = await db.from('sessions').select('id, learner_id, experience, state, turns').eq('id', id).eq('learner_id', learnerId).maybeSingle();
        if (r.data && r.data.experience === experience) return r.data as Session;
      }
      const r = await db.from('sessions').insert({ learner_id: learnerId, experience }).select('id, learner_id, experience, state, turns').single();
      return must(r, 'session') as Session;
    },
    async saveSession(s) {
      must(await db.from('sessions').update({ state: s.state, turns: s.turns, updated_at: new Date().toISOString() }).eq('id', s.id), 'save session');
    },
    async memories(learnerId, limit) {
      const r = await db.from('memories').select('kind, content, importance, experience, created_at').eq('learner_id', learnerId)
        .order('importance', { ascending: false }).order('created_at', { ascending: false }).limit(limit);
      return (must(r, 'memories') || []) as Memory[];
    },
    async remember(learnerId, m) {
      must(await db.from('memories').insert({ learner_id: learnerId, kind: m.kind, content: m.content.slice(0, 300), importance: m.importance, experience: m.experience ?? null }), 'remember');
    },
    async attempts(learnerId, experience, limit) {
      const r = await db.from('attempts').select('skill, metrics, score, created_at').eq('learner_id', learnerId).eq('experience', experience)
        .order('created_at', { ascending: false }).limit(limit);
      return (must(r, 'attempts') || []) as Attempt[];
    },
    async addAttempt(sessionId, learnerId, experience, a) {
      must(await db.from('attempts').insert({ session_id: sessionId, learner_id: learnerId, experience, skill: a.skill, metrics: a.metrics, score: a.score }), 'attempt');
    },
    async trace(row) { await db.from('traces').insert(row); },
    async search(query, experience, k) {
      const v = await embed(query);
      if (v) {
        const r = await db.rpc('match_knowledge', { query_embedding: v, match_count: k, exp: experience });
        if (!r.error && r.data?.length) return r.data as Passage[];
      }
      // no embeddings yet: plain keyword match, so the agent still has its sources
      const term = query.split(/\s+/).filter((w) => w.length > 3).slice(0, 3).join(' | ');
      const r = await db.from('knowledge').select('experience, title, content_en, content_ar, source')
        .textSearch('content_en', term || query, { type: 'websearch' }).limit(k);
      return (r.data || []) as Passage[];
    },
    async turnsToday(learnerId) {
      const since = new Date(Date.now() - 24 * 3600e3).toISOString();
      const r = await db.from('sessions').select('turns').eq('learner_id', learnerId).gte('updated_at', since);
      return (r.data || []).reduce((a: number, s: any) => a + (s.turns || 0), 0);
    },
  };
}

// the tests' store: the same behavior, kept in maps
export function memoryStore(kb: Passage[] = []): Store & { dump(): any } {
  const learners = new Map<string, Learner>(), sessions = new Map<string, Session>();
  const mems: (Memory & { learner_id: string })[] = [], atts: (Attempt & { learner_id: string; experience: string })[] = [], traces: any[] = [];
  let n = 0;
  const id = () => 'id' + (++n);
  return {
    async learner(k, lang) { let l = learners.get(k); if (!l) { l = { id: id(), device_key: k, lang }; learners.set(k, l); } l.lang = lang; return l; },
    async session(sid, lid, exp) {
      const s = sid ? sessions.get(sid) : undefined;
      if (s && s.learner_id === lid && s.experience === exp) return s;
      const ns = { id: id(), learner_id: lid, experience: exp, state: {}, turns: 0 }; sessions.set(ns.id, ns); return ns;
    },
    async saveSession(s) { sessions.set(s.id, JSON.parse(JSON.stringify(s))); },
    async memories(lid, limit) { return mems.filter((m) => m.learner_id === lid).sort((a, b) => b.importance - a.importance).slice(0, limit); },
    async remember(lid, m) { mems.push({ ...m, learner_id: lid, created_at: new Date().toISOString() }); },
    async attempts(lid, exp, limit) { return atts.filter((a) => a.learner_id === lid && a.experience === exp).reverse().slice(0, limit); },
    async addAttempt(_sid, lid, exp, a) { atts.push({ ...a, learner_id: lid, experience: exp, created_at: new Date().toISOString() }); },
    async trace(row) { traces.push(row); },
    async search(q, exp, k) {
      const qs = q.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
      return kb.filter((p) => !exp || p.experience === exp || p.experience === 'general')
        .map((p) => ({ ...p, similarity: qs.filter((w) => (p.title + ' ' + p.content_en).toLowerCase().includes(w)).length }))
        .filter((p) => p.similarity > 0).sort((a, b) => b.similarity! - a.similarity!).slice(0, k);
    },
    async turnsToday(lid) { return [...sessions.values()].filter((s) => s.learner_id === lid).reduce((a, s) => a + s.turns, 0); },
    dump() { return { learners: [...learners.values()], sessions: [...sessions.values()], memories: mems, attempts: atts, traces }; },
  };
}
