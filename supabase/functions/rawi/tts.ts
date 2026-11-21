// The voice: Groq's Orpheus text to speech (free tier). Arabic lines in a Saudi voice (canopylabs/orpheus-arabic-saudi),
// English lines in an English one. The free tier allows only a little speech a day, so every line is made once and kept
// in Storage (the private "tts" bucket): a greeting or an answer heard before never costs again. When the voice is
// resting (Groq said 429), the phone speaks with its own voice and the words are on the screen anyway.
//   POST {action: 'tts', text, lang: 'ar'|'en', voice}  ->  audio/wav, or {ok:false, error, retry_ms}
const env = (k: string, d = '') => (globalThis as any).Deno?.env.get(k) ?? d;

const AR = { model: env('TTS_MODEL_AR', 'canopylabs/orpheus-arabic-saudi'), voices: ['fahad', 'sultan', 'abdullah', 'noura', 'lulwa', 'aisha'] };
const EN = { model: env('TTS_MODEL_EN', 'canopylabs/orpheus-v1-english'), voices: ['troy', 'austin', 'daniel', 'autumn', 'diana', 'hannah'] };
const EN_OF: Record<string, string> = { fahad: 'troy', sultan: 'austin', abdullah: 'daniel', noura: 'diana', lulwa: 'hannah', aisha: 'autumn' };
const MAX = 600;          // characters in one request
const PIECE = 190;        // the model takes at most 200 characters at a time

export type Spoken = { audio?: Uint8Array; from?: 'cache' | 'made'; error?: string; status: number; retry_ms?: number; detail?: string };
type Deps = { fetchImpl?: typeof fetch; bucket?: Bucket | null; later?: (p: Promise<unknown>) => void };
export type Bucket = { get(path: string): Promise<Uint8Array | null>; put(path: string, data: Uint8Array): Promise<void> };

const restUntil: Record<string, number> = {};   // per model: resting after a 429, until this time (ms)

// what the voice reads: no markup, links or emoji, one line
export function clean(s: string): string {
  return String(s || '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*_#`>|~]/g, ' ')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, ' ')
    .replace(/[«»"“”]/g, '')
    .replace(/\s+/g, ' ').trim();
}

// pieces of at most PIECE characters, cut at sentence ends, then commas, then spaces
export function pieces(text: string, max = PIECE): string[] {
  const out: string[] = [];
  let rest = text.trim();
  while (rest.length > max) {
    const head = rest.slice(0, max + 1);
    let cut = -1;
    for (const re of [/[.!?؟]\s/g, /[،,;؛:]\s/g, /\s/g]) {
      let m: RegExpExecArray | null; let last = -1;
      while ((m = re.exec(head))) last = m.index + 1;
      if (last > max * 0.3) { cut = last; break; }
    }
    if (cut < 0) cut = max;
    out.push(rest.slice(0, cut).trim()); rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

// one WAV from several (same format): the first file's format, every file's samples
export function joinWav(parts: Uint8Array[]): Uint8Array {
  if (parts.length === 1) return parts[0];
  let fmt: Uint8Array | null = null;
  const datas: Uint8Array[] = [];
  for (const w of parts) {
    const dv = new DataView(w.buffer, w.byteOffset, w.byteLength);
    let o = 12;
    while (o + 8 <= w.length) {
      const id = String.fromCharCode(w[o], w[o + 1], w[o + 2], w[o + 3]);
      let size = dv.getUint32(o + 4, true);
      if (id === 'fmt ' && !fmt) fmt = w.slice(o + 8, o + 8 + size);
      if (id === 'data') {
        if (size === 0 || size === 0xffffffff || o + 8 + size > w.length) size = w.length - (o + 8);   // a streamed file
        datas.push(w.slice(o + 8, o + 8 + size)); break;
      }
      o += 8 + size + (size & 1);
    }
  }
  if (!fmt) return parts[0];
  const n = datas.reduce((a, d) => a + d.length, 0);
  const out = new Uint8Array(12 + 8 + fmt.length + 8 + n), dv = new DataView(out.buffer);
  const w4 = (o: number, s: string) => { for (let i = 0; i < 4; i++) out[o + i] = s.charCodeAt(i); };
  w4(0, 'RIFF'); dv.setUint32(4, out.length - 8, true); w4(8, 'WAVE');
  w4(12, 'fmt '); dv.setUint32(16, fmt.length, true); out.set(fmt, 20);
  let o = 20 + fmt.length; w4(o, 'data'); dv.setUint32(o + 4, n, true); o += 8;
  for (const d of datas) { out.set(d, o); o += d.length; }
  return out;
}

async function sha(s: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function voiceFor(lang: string, voice: string) {
  const v = String(voice || 'fahad').toLowerCase();
  if (lang === 'en') return { model: EN.model, voice: EN.voices.includes(v) ? v : (EN_OF[v] || 'troy') };
  return { model: AR.model, voice: AR.voices.includes(v) ? v : 'fahad' };
}

export async function speech(body: any, deps: Deps = {}): Promise<Spoken> {
  const lang = body?.lang === 'en' ? 'en' : 'ar';
  const text = clean(body?.text).slice(0, MAX);
  if (!text) return { error: 'empty', status: 400 };
  const { model, voice } = voiceFor(lang, body?.voice);
  const path = voice + '/' + (await sha(model + '|' + voice + '|' + text)) + '.wav';
  // heard before: from Storage
  if (deps.bucket) { try { const hit = await deps.bucket.get(path); if (hit && hit.length > 44) return { audio: hit, from: 'cache', status: 200 }; } catch (_) { /* made again */ } }
  const wait = (restUntil[model] ?? 0) - Date.now();
  if (wait > 0) return { error: 'busy', status: 429, retry_ms: wait };
  const key = env('TTS_API_KEY') || env('GROQ_API_KEY') || env('LLM_API_KEY');
  const base = env('TTS_BASE_URL', 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
  const f = deps.fetchImpl ?? fetch;
  const wavs: Uint8Array[] = [];
  for (const piece of pieces(text)) {
    let res: Response;
    try {
      res = await f(base + '/audio/speech', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(key ? { authorization: 'Bearer ' + key } : {}) },
        body: JSON.stringify({ model, input: piece, voice, response_format: 'wav' }),
        signal: AbortSignal.timeout(20000),
      });
    } catch (e) { return { error: 'failed', status: 502, detail: String(e).slice(0, 200) }; }
    if (!res.ok) {
      const t = (await res.text()).slice(0, 300);
      if (res.status === 429) {
        const ra = Number(res.headers.get('retry-after')) || 60;
        restUntil[model] = Date.now() + Math.min(ra, 6 * 3600) * 1000;
        return { error: 'busy', status: 429, retry_ms: Math.min(ra, 6 * 3600) * 1000, detail: t };
      }
      if (/terms/i.test(t)) restUntil[model] = Date.now() + 15 * 60e3;     // the model's terms are not accepted on this account yet
      return { error: /terms/i.test(t) ? 'terms' : 'failed', status: res.status >= 500 ? 502 : 400, detail: t };
    }
    wavs.push(new Uint8Array(await res.arrayBuffer()));
  }
  const audio = joinWav(wavs);
  if (deps.bucket) {   // kept after the reply has gone out
    const save = deps.bucket.put(path, audio).catch(() => { /* next time it is made again */ });
    if (deps.later) deps.later(save); else await save;
  }
  return { audio, from: 'made', status: 200 };
}

export function ttsConfig() {
  const now = Date.now();
  return { ar: AR.model, en: EN.model, resting: Object.entries(restUntil).filter(([, t]) => t > now).map(([m, t]) => m + ' ' + Math.round((t - now) / 1000) + 's') };
}

// Storage, through the service role (the bucket is private: only this function reads and writes it)
let bucketP: Promise<Bucket | null> | null = null;
export function storageBucket(): Promise<Bucket | null> {
  return (bucketP ??= (async () => {
    const url = env('SUPABASE_URL'), sk = env('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !sk) return null;
    const { createClient } = await import('npm:@supabase/supabase-js@2.45.4');
    const db = createClient(url, sk, { auth: { persistSession: false } });
    const st = db.storage;
    try { const b = await st.getBucket('tts'); if (b.error) await st.createBucket('tts', { public: false }); } catch (_) { /* tried on the next instance */ }
    return {
      async get(path: string) { const r = await st.from('tts').download(path); return r.error || !r.data ? null : new Uint8Array(await r.data.arrayBuffer()); },
      async put(path: string, data: Uint8Array) { await st.from('tts').upload(path, new Blob([data as Uint8Array<ArrayBuffer>], { type: 'audio/wav' }), { contentType: 'audio/wav', upsert: true }); },
    };
  })().catch(() => { bucketP = null; return null; }));
}
