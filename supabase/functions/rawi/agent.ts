// One turn of Rawi: read what happened (an event, a measured attempt, something the learner said or
// sang), recall the learner, think with tools, act, and say one short thing out loud. Every step is
// written to the trace so the judges can watch the agent work.
import { chat as llmChat, transcribe as asr, type Msg, type ToolCall } from './llm.ts';
import { personaFor } from './personas.ts';
import { TOOLS, toolDefs, type ToolCtx } from './tools.ts';
import { align, wordTiming } from './arabic.ts';
import type { Store, Attempt, Memory } from './store.ts';

export type Deps = { store: Store; chat?: typeof llmChat; transcribe?: typeof asr; now?: () => number };
export type TurnInput =
  | { type: 'start'; context?: Record<string, unknown> }
  | { type: 'say'; text?: string; audio?: Audio }
  | { type: 'event'; name: string; data?: Record<string, unknown> }
  | { type: 'attempt'; skill: string; drill?: Record<string, unknown>; metrics?: Record<string, any>; audio?: Audio; expected?: { text: string; starts?: number[] } }
  | { type: 'finish' };
type Audio = { b64: string; mime?: string; offset?: number };
export type TurnBody = { device: string; lang?: string; experience?: string; session_id?: string; input: TurnInput };

const MAX_STEPS = 4;
const env = (k: string, d = '') => (globalThis as any).Deno?.env.get(k) ?? d;
const lastTurnAt = new Map<string, number>();

function langLine(lang: string) {
  return lang === 'ar'
    ? 'in Saudi Najdi Arabic, warm and simple, the way the app itself speaks (حط، خلها، زين، وش). Address them in the masculine singular like the app does (اجلس، اضرب، جرّب), and in the feminine only once you know the learner is a woman (her name, her own words)'
    : 'in simple, warm English; keep the Arabic names of things (tar, dallah, najr) and give their meaning the first time';
}

const LEVELS: Record<number, string> = { 1: 'the other row answers first, words shown', 2: 'right after the call, words shown', 3: 'from memory, no words', 4: 'the learner leads the call' };

// Where things stand after Rawi's own earlier actions, in plain words. (Never as "name {json}": a model that
// sees that in its past lines starts writing its tool calls into what it says, instead of calling them.)
function standLines(running: Record<string, any>) {
  return Object.entries(running || {}).map(([name, g]: [string, any]) => {
    g = g || {};
    switch (name) {
      case 'start_drill': return `- the last drill you set: the ${g.poem} poem, half ${g.half}, level ${g.level} (${LEVELS[g.level] || '?'}), ${g.style}` + (g.focus && g.focus !== 'both' ? `, focus on ${g.focus}` : '') + ' (an attempt ends it)';
      case 'guide_step': return `- you last pointed them at the ${g.step} step`;
      case 'set_fahad_skill': return `- your own shooting skill is set to ${g.skill}`;
      case 'weave_band': return `- you already wove them a piece called ${g.title} (${g.bands?.length || 1} band(s))`;
      default: return '- you used ' + name.replace(/_/g, ' ');
    }
  }).join('\n');
}

// Now and then a model writes a tool call into its text instead of making it ("[start_drill {...}]",
// "start_drill({...})", "<function=start_drill>{...}</function>", a <tool_call> block). Those are cut out of
// the spoken line and handed back as real calls, so the drill still starts and nobody hears JSON read aloud.
export function salvageCalls(text: string, names: string[]): { text: string; calls: { name: string; args: any }[] } {
  const s = text || '';
  const calls: { name: string; args: any }[] = [];
  const cuts: [number, number][] = [];
  const key = (n: string) => n.replace(/[^a-z]/gi, '').toLowerCase();
  const byKey = new Map(names.map((n) => [key(n), n]));
  const objAt = (i: number) => {                       // the balanced {...} that starts at i
    let depth = 0, str = false, esc = false;
    for (let j = i; j < s.length; j++) {
      const c = s[j];
      if (str) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') str = false; continue; }
      if (c === '"') str = true; else if (c === '{') depth++; else if (c === '}' && --depth === 0) return j + 1;
    }
    return -1;
  };
  const parse = (a: number, b: number) => { try { const v = JSON.parse(s.slice(a, b)); return v && typeof v === 'object' ? v : null; } catch { return null; } };
  const widen = (a: number, b: number): [number, number] => {   // take the brackets and tags around it too
    const before = s.slice(0, a).match(/(<tool_call>|<function=[\w-]*>?|[[(])?\s*$/);
    const after = s.slice(b).match(/^\s*(<\/tool_call>|<\/function>|[\])])?/);
    return [a - (before?.[0].length || 0), b + (after?.[0].length || 0)];
  };
  const taken = (i: number) => cuts.some(([a, b]) => i >= a && i < b);
  // a tool name followed by its arguments
  const nameRe = new RegExp('(' + names.map((n) => n.split('_').join('[_ -]?')).join('|') + ')\\s*[>(:=]?\\s*(?=\\{)', 'gi');
  for (const m of s.matchAll(nameRe)) {
    const start = m.index!, open = start + m[0].length, end = objAt(open);
    const name = byKey.get(key(m[1])), args = end > 0 ? parse(open, end) : null;
    if (!name || !args || taken(start)) continue;
    calls.push({ name, args }); cuts.push(widen(start, end));
  }
  // {"name": "...", "arguments": {...}} written as JSON, and any other JSON left in the line
  for (let i = s.indexOf('{'); i >= 0; i = s.indexOf('{', i + 1)) {
    if (taken(i)) continue;
    const end = objAt(i), v = end > 0 ? parse(i, end) : null;
    if (!v) continue;
    const name = typeof v.name === 'string' ? byKey.get(key(v.name)) : undefined;
    let args = v.arguments ?? v.parameters;
    if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = null; } }
    if (name && args && typeof args === 'object') calls.push({ name, args });
    cuts.push(widen(i, end));
  }
  let out = '', at = 0;
  for (const [a, b] of cuts.sort((x, y) => x[0] - y[0])) { if (a >= at) { out += s.slice(at, a); at = b; } else at = Math.max(at, b); }
  out += s.slice(at);
  out = out.replace(/<\/?(tool_call|function)[^>]*>/gi, ' ').replace(/\[\s*\]|\(\s*\)/g, ' ').replace(/[ \t]+/g, ' ').replace(/\s+([،,.!؟?])/g, '$1').trim();
  return { text: out, calls };
}

// The last turns, given back to the model the way it was trained on them: what came in, what it said, and the
// tools it called. Plain text alone teaches it to stop calling tools; "name {json}" notes teach it to write them.
type Recent = { u: string; a: string; c: { name: string; args: any }[] };
function recentMessages(recent: Recent[]): Msg[] {
  const out: Msg[] = [];
  recent.forEach((t, i) => {
    out.push({ role: 'user', content: t.u });
    const calls: ToolCall[] = (t.c || []).map((c, k) => ({ id: `h${i}_${k}`, type: 'function', function: { name: c.name, arguments: JSON.stringify(c.args) } }));
    out.push({ role: 'assistant', content: t.a || '', ...(calls.length ? { tool_calls: calls } : {}) });
    for (const c of calls) out.push({ role: 'tool', tool_call_id: c.id, content: c.function.name === 'remember' ? '{"ok":true}' : '{"ok":true,"queued":true}' });
  });
  return out;
}
function legacyRecent(h: any): Recent[] {     // sessions saved before the turns were kept with their tool calls
  if (!Array.isArray(h)) return [];
  const out: Recent[] = [];
  for (let i = 0; i + 1 < h.length; i++) {
    if (h[i]?.role === 'user' && h[i + 1]?.role === 'assistant') { out.push({ u: String(h[i].content || ''), a: salvageCalls(String(h[i + 1].content || ''), Object.keys(TOOLS)).text, c: [] }); i++; }
  }
  return out.slice(-4);
}

function memLines(ms: Memory[]) {
  if (!ms.length) return 'Nothing yet: this is their first visit.';
  return ms.map((m) => `- (${m.kind}${m.experience ? ', ' + m.experience : ''}) ${m.content}`).join('\n');
}

function compactMetrics(m: Record<string, any>) {
  const out: string[] = [];
  if (m.strikes) out.push(`strikes ${m.strikes.hit}/${m.strikes.expected}` + (m.strikes.mean_offset_ms != null ? ` offset ${m.strikes.mean_offset_ms > 0 ? '+' : ''}${m.strikes.mean_offset_ms}ms` : ''));
  if (m.words) out.push(`words ${Math.round((m.words.accuracy ?? 0) * 100)}%` + (m.words.missed?.length ? ` missed ${m.words.missed.slice(0, 3).join(' ')}` : ''));
  for (const k of Object.keys(m)) if (!['strikes', 'words', 'voice', 'drill'].includes(k) && typeof m[k] !== 'object') out.push(`${k} ${m[k]}`);
  return out.join(', ');
}

function progressLines(as: Attempt[]) {
  if (!as.length) return 'None yet.';
  return as.slice(0, 6).map((a) => {
    const d = a.metrics?.drill;
    const what = d ? `${d.poem} half ${d.half} level ${d.level} (${LEVELS[d.level] || '?'}) ${d.style || ''}`.trim() : a.skill;
    return `- ${what}: score ${a.score == null ? '?' : Math.round(a.score * 100)}; ${compactMetrics(a.metrics || {})}`;
  }).join('\n');
}

export function systemPrompt(exp: string, lang: string, memories: Memory[], attempts: Attempt[], running: Record<string, any> = {}) {
  const p = personaFor(exp);
  return [
    `You are Rawi, the heritage agent of CultureLens, a Saudi heritage app. Here you are ${p.name.en} (${p.name.ar}): ${p.role}`,
    `Speak to the learner ${langLine(lang)}. You are speaking out loud: one to three short sentences, no lists, no emojis, no markdown.`,
    'Heritage facts only from this prompt or from search_heritage. What you say about the learner only from the measurements you are given: if something was not measured this time (no words, no voice), say nothing about it. Never invent either.',
    'Act through your tools, and put your spoken line in the same message as your tool calls. A tool runs only when you call it: never write a tool name or JSON in what you say, and only announce what your calls actually do. Use remember for what is worth keeping across visits: their name, what they love, a skill they now have, a mistake they keep making.',
    p.playbook,
    'What you remember about this learner, from every experience:\n' + memLines(memories),
    'Their recent tries here:\n' + progressLines(attempts),
    ...(Object.keys(running || {}).length ? ['Where things stand, from your own earlier actions:\n' + standLines(running)] : []),
  ].join('\n\n');
}

function b64bytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/^data:[^,]+,/, ''));
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

// how good an attempt was, 0..1, from what was measured (the agent sees the parts, this is for the charts)
export function scoreOf(m: Record<string, any>): number | null {
  const parts: [number, number][] = [];
  if (m.strikes?.expected) parts.push([Math.min(1, m.strikes.hit / m.strikes.expected), 0.5]);
  if (m.words?.expected_count) parts.push([m.words.accuracy ?? 0, 0.5]);
  if (typeof m.score === 'number') parts.push([Math.max(0, Math.min(1, m.score)), 1]);
  if (!parts.length) return null;
  const w = parts.reduce((a, p) => a + p[1], 0);
  return Math.round((parts.reduce((a, p) => a + p[0] * p[1], 0) / w) * 100) / 100;
}

export async function handleTurn(body: TurnBody, deps: Deps) {
  const store = deps.store, chat = deps.chat ?? llmChat, transcribe = deps.transcribe ?? asr, now = deps.now ?? Date.now;
  const device = String(body.device || '').slice(0, 64);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(device)) throw new Error('bad device key');
  const lang = body.lang === 'en' ? 'en' : 'ar';
  const experience = (body.experience || 'general').replace(/[^a-z_]/g, '').slice(0, 24) || 'general';
  const input = body.input || { type: 'start' } as TurnInput;
  const persona = personaFor(experience);

  const wait = (lastTurnAt.get(device) ?? 0) + 1200 - now();
  if (wait > 0) return { ok: false, error: 'slow down', retry_ms: wait };
  lastTurnAt.set(device, now());

  const learner = await store.learner(device, lang);
  if ((await store.turnsToday(learner.id)) >= Number(env('RAWI_DAILY_TURNS', '400'))) return { ok: false, error: 'daily limit' };
  const session = await store.session(body.session_id, learner.id, experience);
  const turn = (session.turns || 0) + 1;
  let step = 0;
  const trace: { kind: string; name?: string; ms?: number; brief?: string }[] = [];
  const pending: Promise<unknown>[] = [];
  const log = (kind: string, name: string | undefined, payload: unknown, ms?: number, brief?: string) => {
    step++;
    trace.push({ kind, name, ms, brief });
    pending.push(store.trace({ session_id: session.id, experience, turn, step, kind, name, payload, ms }).catch(() => {}));
  };

  // 1. what happened, in words the model can reason about
  let userText = '';
  let heard: any = null;
  if (input.type === 'start') {
    userText = `[The learner just opened this experience${input.context ? '; ' + JSON.stringify(input.context).slice(0, 300) : ''}.]`;
  } else if (input.type === 'finish') {
    userText = '[The learner wants to stop here. Sum up what they did in one or two sentences, remember what matters, and say goodbye in your role.]';
  } else if (input.type === 'event') {
    userText = `[Event: ${String(input.name).slice(0, 40)} ${JSON.stringify(input.data ?? {}).slice(0, 600)}]`;
  } else if (input.type === 'say') {
    let text = String(input.text || '').slice(0, 500);
    if (input.audio?.b64) {
      const t0 = now();
      const r = await transcribe(b64bytes(input.audio.b64), input.audio.mime || 'audio/wav', lang);
      text = r.text.slice(0, 500);
      log('ear', r.model, { text }, now() - t0, text);
    }
    if (!text) return { ok: false, error: 'nothing heard' };
    userText = `The learner says: «${text}»`;
    heard = { text };
  } else if (input.type === 'attempt') {
    const metrics: Record<string, any> = { ...(input.metrics || {}) };
    if (input.drill) metrics.drill = input.drill;
    if (input.audio?.b64 && input.expected?.text) {
      const t0 = now();
      try {
        const r = await transcribe(b64bytes(input.audio.b64), input.audio.mime || 'audio/wav', lang === 'en' ? 'ar' : 'ar');
        const al = align(input.expected.text, r.text);
        const tm = input.expected.starts ? wordTiming(input.expected.text, input.expected.starts, r.words, input.audio.offset || 0) : null;
        metrics.words = { accuracy: Math.round(al.accuracy * 100) / 100, expected_count: al.expected.length, matched: al.matched, missed: al.missed.slice(0, 6), heard: r.text.slice(0, 160), ...(tm ? { timing: tm } : {}) };
        heard = { text: r.text, accuracy: metrics.words.accuracy, missed: al.missed, pairs: al.pairs };
        log('ear', r.model, { heard: r.text, expected: input.expected.text, accuracy: metrics.words.accuracy, missed: al.missed, timing: tm }, now() - t0,
          `${Math.round(al.accuracy * 100)}% of the words`);
      } catch (e) {
        metrics.words = { error: 'could not transcribe' };
        log('error', 'ear', { error: String(e).slice(0, 300) });
      }
    }
    const score = scoreOf(metrics);
    await store.addAttempt(session.id, learner.id, experience, { skill: String(input.skill).slice(0, 40), metrics, score });
    // said plainly, so the model does not fill the gap: "no words this time" beats a missing key
    const unmeasured = (persona.measures || []).filter((k) => metrics[k] == null || metrics[k]?.error);
    userText = `[Attempt ${String(input.skill).slice(0, 40)}${score != null ? ', score ' + Math.round(score * 100) : ''}] ` + JSON.stringify(metrics).slice(0, 900) +
      (unmeasured.length ? ` Not measured this time: ${unmeasured.join(', ')}.` : '');
  }
  log('input', input.type, { text: userText }, undefined, userText.slice(0, 140));

  // 2. recall: the learner's memory and recent tries go into the prompt, and the last turns as they happened
  const [memories, attempts] = await Promise.all([store.memories(learner.id, 10), store.attempts(learner.id, experience, 6)]);
  const tools = toolDefs(persona.tools);
  const recent: Recent[] = Array.isArray(session.state?.recent) ? session.state.recent.slice(-4) : legacyRecent(session.state?.history);
  const messages: Msg[] = [{ role: 'system', content: systemPrompt(experience, lang, memories, attempts, session.state?.running || {}) }, ...recentMessages(recent), { role: 'user', content: userText }];

  // 3. think and act
  const ctx: ToolCtx = { store, learnerId: learner.id, experience, lang, actions: [], notes: [] };
  const made: { name: string; args: any }[] = [];          // what it did this turn, kept for the next turns
  const runCalls = async (calls: ToolCall[], fromText: boolean) => {
    let needMore = false;
    for (const call of calls) {
      const tool = TOOLS[call.function.name];
      let args: any = {};
      try { args = JSON.parse(call.function.arguments || '{}'); } catch { args = null; }
      const t0 = now();
      let result: any;
      if (!tool || !persona.tools.includes(call.function.name)) result = { ok: false, error: 'no such tool here' };
      else if (args === null) result = { ok: false, error: 'arguments were not valid JSON' };
      else { try { result = await tool.run(args, ctx); } catch (e) { result = { ok: false, error: String(e).slice(0, 200) }; } }
      log('tool', call.function.name, { args, result, ...(fromText ? { from_text: true } : {}) }, now() - t0, call.function.name + ' ' + JSON.stringify(args).slice(0, 120));
      if (!tool || tool.needsResult || result?.ok === false) needMore = true;
      else made.push({ name: call.function.name, args: tool.kind === 'client' ? ctx.actions.at(-1)?.args ?? args : args });
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result).slice(0, 2000) });
    }
    return needMore;
  };
  const textCalls = (cs: { name: string; args: any }[], s: number | string): ToolCall[] =>
    cs.map((c, i) => ({ id: `text_${turn}_${s}_${i}`, type: 'function', function: { name: c.name, arguments: JSON.stringify(c.args) } }));
  let say = '', model = '', lastText = '';
  for (let s = 0; s < MAX_STEPS; s++) {
    const last = s === MAX_STEPS - 1;
    const out = await chat(messages, tools, { temperature: 0.5, max_tokens: 420, tool_choice: last ? 'none' : 'auto' });
    model = out.model;
    log('model', out.model, { usage: out.usage, tries: out.tries }, out.ms, `${out.model}${out.usage?.total_tokens ? ' · ' + out.usage.total_tokens + ' tokens' : ''}`);
    const sv = salvageCalls(out.msg.content || '', persona.tools);
    const content = sv.text;
    let calls = out.msg.tool_calls || [];
    const fromText = !calls.length && sv.calls.length > 0;    // it wrote its calls instead of making them: make them
    if (fromText) calls = textCalls(sv.calls, s);
    if (content) lastText = content;
    messages.push({ role: 'assistant', content, ...(calls.length ? { tool_calls: calls } : {}) });
    if (!calls.length) { say = content; break; }
    const needMore = await runCalls(calls, fromText);
    // the actions are queued and nothing needs reading back: if it already said its line, the turn is done
    if (!needMore && content) { say = content; break; }
  }
  if (!say) say = lastText;

  // 4. it checks its own turn: a measured attempt always gets a next step (which one is still its choice)
  if (input.type === 'attempt' && persona.next && !ctx.actions.some((a) => a.name === persona.next)) {
    messages.push({ role: 'user', content: `[You have not set the next step yet. Call ${persona.next} now, to fit what you just told the learner.]` });
    try {
      const out = await chat(messages, toolDefs([persona.next]), { temperature: 0.3, max_tokens: 200, tool_choice: { type: 'function', function: { name: persona.next } } });
      log('model', out.model, { usage: out.usage, tries: out.tries, check: persona.next }, out.ms, 'self-check: ' + persona.next);
      const sv = salvageCalls(out.msg.content || '', [persona.next]);
      const fromText = !out.msg.tool_calls?.length;
      const calls = (fromText ? textCalls(sv.calls, 'check') : out.msg.tool_calls!).slice(0, 1);
      if (calls.length) { messages.push({ role: 'assistant', content: '', tool_calls: calls }); await runCalls(calls, fromText); }
      if (!say) say = sv.text;
    } catch (e) { log('error', 'self-check', { error: String(e).slice(0, 300) }); }
  }
  say = say.replace(/[*_#`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 600);
  log('reply', persona.name.en, { say, actions: ctx.actions }, undefined, say.slice(0, 160));

  // 5. keep a short memory of the conversation for the next turn: what was said and done, and where things stand
  const running = { ...(session.state?.running || {}) };
  for (const a of ctx.actions) if (a.name !== 'show_card') running[a.name] = a.args;
  const { history: _old, ...state } = session.state || {};
  session.state = {
    ...state,
    recent: [...recent, { u: userText.slice(0, 700), a: say.slice(0, 700), c: made.slice(0, 4) }].slice(-4),
    last_actions: ctx.actions,
    running,
  };
  session.turns = turn;
  pending.push(store.saveSession(session));
  await Promise.allSettled(pending);
  return { ok: true, session_id: session.id, turn, say, actions: ctx.actions, heard, remembered: ctx.notes, model, trace };
}
