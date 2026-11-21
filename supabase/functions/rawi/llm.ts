// The brain: any OpenAI-compatible chat API. By default Groq's free tier (Qwen first), and it can point at
// Ollama on our own laptop instead (LLM_BASE_URL=https://<tunnel>/v1, LLM_MODELS=qwen3.5:9b).
// A small router: each model has its own free rate limit, so when one is busy (429) or down, the next takes
// the turn, and a busy model rests until its Retry-After has passed.

export type Msg = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
};
export type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } };
export type ToolDef = { type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } };
export type ChatOut = { msg: Msg; model: string; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }; ms: number; tries: string[] };

const env = (k: string, d = '') => (globalThis as any).Deno?.env.get(k) ?? d;

export function llmConfig() {
  return {
    baseUrl: env('LLM_BASE_URL', 'https://api.groq.com/openai/v1').replace(/\/+$/, ''),
    apiKey: env('LLM_API_KEY') || env('GROQ_API_KEY'),
    models: env('LLM_MODELS', 'qwen/qwen3.8-27b,qwen/qwen3-32b,openai/gpt-oss-120b,llama-3.3-70b-versatile')
      .split(',').map((s: string) => s.trim()).filter(Boolean),
  };
}

// models resting after a 429, until this time (ms since epoch). Lives as long as the function instance.
const restUntil = new Map<string, number>();

// what each family needs to answer directly (no long hidden reasoning, which costs time and tokens)
function extrasFor(model: string): Record<string, unknown> {
  const m = model.toLowerCase();
  if (m.includes('gpt-oss')) return { reasoning_effort: 'low' };
  if (m.includes('qwen3') && !m.includes(':')) return { reasoning_effort: 'none' };   // Groq-hosted Qwen in instruct mode; Ollama tags have ':'
  return {};
}

export function stripThink(s: string | null | undefined): string {
  return (s || '').replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^[\s\S]*?<\/think>/i, '').trim();
}

export async function chat(
  messages: Msg[], tools: ToolDef[],
  opts: { temperature?: number; max_tokens?: number; tool_choice?: 'auto' | 'none'; fetchImpl?: typeof fetch } = {},
): Promise<ChatOut> {
  const cfg = llmConfig();
  const f = opts.fetchImpl ?? fetch;
  const tries: string[] = [];
  let lastErr = 'no model available';
  const t0 = Date.now();
  for (const model of cfg.models) {
    if ((restUntil.get(model) ?? 0) > Date.now()) { tries.push(model + ':resting'); continue; }
    let extras = extrasFor(model);
    for (let attempt = 0; attempt < 3; attempt++) {
      const body: Record<string, unknown> = {
        model, messages, temperature: opts.temperature ?? 0.5, max_tokens: opts.max_tokens ?? 450, ...extras,
      };
      if (tools.length) { body.tools = tools; body.tool_choice = opts.tool_choice ?? 'auto'; }
      let res: Response;
      try {
        res = await f(cfg.baseUrl + '/chat/completions', {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...(cfg.apiKey ? { authorization: 'Bearer ' + cfg.apiKey } : {}) },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(25000),
        });
      } catch (e) { lastErr = model + ': ' + String(e); tries.push(model + ':neterr'); break; }
      if (res.ok) {
        const j = await res.json();
        const msg = j.choices?.[0]?.message ?? { role: 'assistant', content: '' };
        msg.content = stripThink(msg.content);
        if (msg.tool_calls && !msg.tool_calls.length) delete msg.tool_calls;
        tries.push(model + ':ok');
        return { msg, model, usage: j.usage, ms: Date.now() - t0, tries };
      }
      const text = await res.text();
      lastErr = model + ' ' + res.status + ': ' + text.slice(0, 300);
      if (res.status === 429 || res.status === 413) {
        const ra = Number(res.headers.get('retry-after')) || 20;
        restUntil.set(model, Date.now() + Math.min(ra, 120) * 1000);
        tries.push(model + ':busy'); break;
      }
      if (res.status >= 500) { tries.push(model + ':' + res.status); break; }
      if (res.status === 400 && Object.keys(extras).length && /reasoning|unsupported|not supported/i.test(text)) {
        extras = {}; tries.push(model + ':noextras'); continue;   // this model does not take the reasoning settings
      }
      if (res.status === 400 && /tool_use_failed|failed to call a function|tool call validation/i.test(text) && attempt < 2) {
        tries.push(model + ':badtool'); continue;                  // the model wrote a broken tool call: one more go
      }
      if (res.status === 404 || /model_not_found|does not exist|decommissioned/i.test(text)) { tries.push(model + ':gone'); break; }
      tries.push(model + ':' + res.status); break;
    }
  }
  throw new Error('LLM unavailable (' + tries.join(', ') + '): ' + lastErr);
}

// The ear: Whisper (free on Groq), word timestamps included when the API gives them
export async function transcribe(wav: Uint8Array, mime: string, lang: string, fetchImpl?: typeof fetch) {
  const base = env('ASR_BASE_URL', 'https://api.groq.com/openai/v1').replace(/\/+$/, '');   // stays on Groq even when the brain moves
  const key = env('ASR_API_KEY') || env('GROQ_API_KEY') || env('LLM_API_KEY');
  const model = env('ASR_MODEL', 'whisper-large-v3-turbo');
  const f = fetchImpl ?? fetch;
  const ext = mime.includes('wav') ? 'wav' : mime.includes('mp4') || mime.includes('m4a') ? 'm4a' : mime.includes('webm') ? 'webm' : 'wav';
  const form = (words: boolean) => {
    const fd = new FormData();
    fd.append('file', new Blob([wav as Uint8Array<ArrayBuffer>], { type: mime }), 'take.' + ext);
    fd.append('model', model);
    fd.append('language', lang === 'en' ? 'en' : 'ar');
    fd.append('response_format', 'verbose_json');
    if (words) fd.append('timestamp_granularities[]', 'word');
    fd.append('temperature', '0');
    return fd;
  };
  const t0 = Date.now();
  const send = (words: boolean) => f(base + '/audio/transcriptions', {
    method: 'POST', headers: key ? { authorization: 'Bearer ' + key } : {}, body: form(words), signal: AbortSignal.timeout(20000),
  });
  let res = await send(true);
  if (res.status === 400) res = await send(false);      // an ear without word timestamps still gives the words
  if (!res.ok) throw new Error('ASR ' + res.status + ': ' + (await res.text()).slice(0, 200));
  const j = await res.json();
  return {
    text: String(j.text || '').trim(),
    words: Array.isArray(j.words) ? j.words.map((w: any) => ({ w: String(w.word || '').trim(), s: Number(w.start), e: Number(w.end) })) : [],
    model, ms: Date.now() - t0,
  };
}
