// One turn of Rawi: read what happened (an event, a measured attempt, something the learner said or
// sang), recall the learner, think with tools, act, and say one short thing out loud. Every step is
// written to the trace so the judges can watch the agent work.
import { chat as llmChat, transcribe as asr, type Msg } from './llm.ts';
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
    ? 'in Saudi Najdi Arabic, warm and simple, the way the app itself speaks (حط، خلها، زين، وش)'
    : 'in simple, warm English; keep the Arabic names of things (tar, dallah, najr) and give their meaning the first time';
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
    const what = d ? `${d.poem} half ${d.half} level ${d.level} ${d.style || ''}`.trim() : a.skill;
    return `- ${what}: score ${a.score == null ? '?' : Math.round(a.score * 100)}; ${compactMetrics(a.metrics || {})}`;
  }).join('\n');
}

export function systemPrompt(exp: string, lang: string, memories: Memory[], attempts: Attempt[]) {
  const p = personaFor(exp);
  return [
    `You are Rawi, the heritage agent of CultureLens, a Saudi heritage app. Here you are ${p.name.en} (${p.name.ar}): ${p.role}`,
    `Speak to the learner ${langLine(lang)}. You are speaking out loud: one to three short sentences, no lists, no emojis, no markdown.`,
    'Heritage facts only from this prompt or from search_heritage. Numbers about the learner only from the measurements you are given. Never invent either.',
    'Act through your tools, and put your spoken line in the same message as your tool calls. Use remember for what is worth keeping across visits: their name, what they love, a skill they now have, a mistake they keep making.',
    p.playbook,
    'What you remember about this learner, from every experience:\n' + memLines(memories),
    'Their recent tries here:\n' + progressLines(attempts),
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
    userText = `[Attempt ${String(input.skill).slice(0, 40)}${score != null ? ', score ' + Math.round(score * 100) : ''}] ` + JSON.stringify(metrics).slice(0, 900);
  }
  log('input', input.type, { text: userText }, undefined, userText.slice(0, 140));

  // 2. recall: the learner's memory and recent tries go into the prompt
  const [memories, attempts] = await Promise.all([store.memories(learner.id, 10), store.attempts(learner.id, experience, 6)]);
  const persona = personaFor(experience);
  const tools = toolDefs(persona.tools);
  const history: Msg[] = Array.isArray(session.state?.history) ? session.state.history.slice(-8) : [];
  const messages: Msg[] = [{ role: 'system', content: systemPrompt(experience, lang, memories, attempts) }, ...history, { role: 'user', content: userText }];

  // 3. think and act
  const ctx: ToolCtx = { store, learnerId: learner.id, experience, lang, actions: [], notes: [] };
  let say = '', model = '';
  for (let s = 0; s < MAX_STEPS; s++) {
    const last = s === MAX_STEPS - 1;
    const out = await chat(messages, tools, { temperature: 0.5, max_tokens: 420, tool_choice: last ? 'none' : 'auto' });
    model = out.model;
    log('model', out.model, { usage: out.usage, tries: out.tries }, out.ms, `${out.model}${out.usage?.total_tokens ? ' · ' + out.usage.total_tokens + ' tokens' : ''}`);
    const msg = out.msg;
    const calls = msg.tool_calls || [];
    if (!calls.length) { say = msg.content || ''; break; }
    messages.push({ role: 'assistant', content: msg.content || '', tool_calls: calls });
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
      log('tool', call.function.name, { args, result }, now() - t0, call.function.name + ' ' + JSON.stringify(args).slice(0, 120));
      if (!tool || tool.needsResult || result?.ok === false) needMore = true;
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result).slice(0, 2000) });
    }
    // the actions are queued and nothing needs reading back: if it already said its line, the turn is done
    if (!needMore && msg.content) { say = msg.content; break; }
  }
  say = say.replace(/[*_#`]/g, '').trim().slice(0, 600);
  log('reply', persona.name.en, { say, actions: ctx.actions }, undefined, say.slice(0, 160));

  // 4. keep a short memory of the conversation for the next turn
  const actionNote = ctx.actions.length ? ' [' + ctx.actions.map((a) => a.name + ' ' + JSON.stringify(a.args).slice(0, 80)).join('; ') + ']' : '';
  session.state = {
    ...(session.state || {}),
    history: [...history, { role: 'user', content: userText.slice(0, 700) }, { role: 'assistant', content: (say + actionNote).slice(0, 700) }].slice(-8),
    last_actions: ctx.actions,
  };
  session.turns = turn;
  pending.push(store.saveSession(session));
  await Promise.allSettled(pending);
  return { ok: true, session_id: session.id, turn, say, actions: ctx.actions, heard, remembered: ctx.notes, model, trace };
}
