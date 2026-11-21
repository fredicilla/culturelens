// Rawi, the CultureLens heritage agent, as one Supabase Edge Function.
//   POST {action: 'turn', device, lang, experience, session_id?, input}   one agent turn (see agent.ts)
//   POST {action: 'tts', text, lang, voice}                                 the line in a Saudi voice (audio/wav, see tts.ts)
//   GET  ?health=1                                                         which brain, ear and voice are configured
// Secrets (Dashboard > Edge Functions > Secrets): GROQ_API_KEY (free at console.groq.com).
// The heritage notes load themselves on the first turns (store.ts): from rawi-knowledge.json, embedded with gte-small.
// Optional: LLM_BASE_URL, LLM_MODELS, ASR_MODEL, RAWI_DAILY_TURNS.
import { handleTurn } from './agent.ts';
import { supabaseStore, later } from './store.ts';
import { llmConfig } from './llm.ts';
import { speech, storageBucket, ttsConfig } from './tts.ts';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-max-age': '7200',     // the phone asks once, not before every turn
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'content-type': 'application/json' } });
const env = (k: string) => Deno.env.get(k) ?? '';
let storeP: ReturnType<typeof supabaseStore> | null = null;
const store = () => (storeP ??= supabaseStore().catch((e) => { storeP = null; throw e; }));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    if (req.method === 'GET') {
      // a page that opens pings this, so the database client is loaded before the first turn
      later(store().catch(() => {}));
      const c = llmConfig();
      return json({ ok: true, agent: 'rawi', brain: { base: c.baseUrl.replace(/^https?:\/\//, '').split('/')[0], models: c.models, key: !!c.apiKey }, ear: env('ASR_MODEL') || 'whisper-large-v3-turbo', voice: ttsConfig() });
    }
    if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);
    const len = Number(req.headers.get('content-length') || 0);
    if (len > 2_500_000) return json({ ok: false, error: 'too big' }, 413);
    const body = await req.json();
    if (body?.action === 'tts') {
      const out = await speech(body, { bucket: await storageBucket(), later });
      if (out.audio) return new Response(out.audio as Uint8Array<ArrayBuffer>, { headers: { ...CORS, 'content-type': 'audio/wav', 'x-voice': out.from || '', 'access-control-expose-headers': 'x-voice' } });
      if (out.detail) console.warn('rawi tts', out.status, out.detail);
      return json({ ok: false, error: out.error, retry_ms: out.retry_ms }, out.status);
    }
    if (body?.action === 'turn') {
      const out = await handleTurn(body, { store: await store() });
      return json(out, out.ok ? 200 : out.error === 'slow down' || out.error === 'daily limit' ? 429 : 400);
    }
    return json({ ok: false, error: 'unknown action' }, 400);
  } catch (e) {
    const msg = String((e as Error)?.message || e);
    console.error('rawi', msg);
    return json({ ok: false, error: /LLM unavailable/.test(msg) ? 'busy' : 'failed', detail: msg.slice(0, 300) }, /LLM unavailable/.test(msg) ? 503 : 500);
  }
});
