# Rawi, the CultureLens heritage agent

One agent with one memory of each learner, taking a role in each part of the app: the mu'allim who teaches the
Samri in his row, Abu Fahad who has you serve in his majlis, Grandma Haya who weaves your story into a Sadu band,
Fahad who plays the Masaqil rematch against you, and Fahad the Najd guide on the home and experience pages.
Each experience's character is its last step (a card on the results screen) and an option on its experience page,
never something running during the experience itself.
It runs as one Supabase Edge Function (`functions/rawi`) and costs nothing on free tiers.

![System overview](../docs/rawi-system-overview.png)

## How a turn works

1. **Perceive**: the phone sends what happened: a game event, a measured attempt (Samri strikes timed by an
   AudioWorklet against the drum clock, plus the sung answer as audio), or something the learner said.
2. **Hear**: a sung or spoken answer goes to Whisper (large-v3-turbo, free on Groq); the transcript is aligned
   word by word with the expected verse after Arabic normalization (`arabic.ts`).
3. **Recall**: the learner's memories (from every experience), their recent attempts, and the last four turns
   with the tools it called go into the prompt. What was not measured this time is said plainly.
4. **Think and act**: Qwen (free on Groq; on a rate limit the router waits a moment if that is enough, otherwise it
   hands the turn to gpt-oss-120b, then gpt-oss-20b, each with its own free minute of about 8K tokens) answers
   in the experience's role and calls tools. Server tools run in the function (`search_heritage` over pgvector,
   `remember`). App tools (`start_drill`, `weave_band`, `guide_step`, `set_fahad_skill`, `show_card`) are
   validated, then sent to the phone; a wrong call goes back to the model as an error to fix, and a call
   written into the text by mistake is turned back into a real one.
5. **Check**: after a measured Samri attempt, if it has not set the next drill, it is asked once more with only
   `start_drill` on offer (which drill is still its choice).
6. **Reply**: one to three spoken sentences, read out on the phone in Arabic or English.
7. **Trace**: every step is written to `traces`; `rawi-judge.html` streams them live (Supabase Realtime).

Heritage facts come only from `knowledge`: 146 passages, the 107 the team wrote and sourced in the experiences and
the 39 of the Najd guide, embedded by the function itself with gte-small (built into the Edge Runtime). The three
session characters carry the few customs they need in their own role (from the same text), so a turn there is one
model call; the teacher and the guide search the notes.

## Set up (about 5 minutes)

1. Create a Supabase project (free).
2. Run both files in `migrations/` (SQL editor, or `supabase db push`).
3. Deploy the function: `supabase functions deploy rawi --no-verify-jwt`
   (the function is public like the app; it limits each device and each day itself).
4. Secrets (Dashboard > Edge Functions > Secrets):
   - `GROQ_API_KEY`: free at console.groq.com
   - optional `LLM_BASE_URL` and `LLM_MODELS` to use another OpenAI-compatible brain, for example Ollama on
     our own laptop: `LLM_BASE_URL=https://<tunnel>/v1`, `LLM_MODELS=qwen3.5:9b`
5. Put the project URL, its anon (publishable) key and the database's region in `rawi-config.js` at the root
   of the app. The phone runs the function in that region: a turn makes several database calls, and pinning
   it next to the database took a turn from about 4.5 s to under 2 s.

## Files

| file | what it does |
|---|---|
| `functions/rawi/index.ts` | the HTTP entry: a turn, and a health check that also wakes it |
| `functions/rawi/agent.ts` | one agent turn: perceive, hear, recall, think with tools, reply, trace |
| `functions/rawi/personas.ts` | who Rawi is in each experience, its playbook and its tools |
| `functions/rawi/tools.ts` | the tools and their checks |
| `functions/rawi/llm.ts` | the model router and the ear (Whisper) |
| `functions/rawi/arabic.ts` | Arabic normalization, word alignment, word timing |
| `functions/rawi/store.ts` | Postgres access and the self-filling embeddings |
| `functions/rawi/knowledge.ts` | the heritage passages |

On the phone: `rawi.js` (the agent's client, with no face of its own), `samri-perform.js` (the Samri teacher: the
last step of the Samri experience, and an option on its experience page), `rawi-session.js` (the same kind of screen
for Abu Fahad and Grandma Haya: their line out loud, hold to talk or type, finish), the Masaqil rematch inside
`masaqeel.js` (Fahad's lines come from the agent and it sets how well he shoots), `najd-guide.js` (Fahad, the Najd
guide, who answers through the agent and falls back to his own notes offline), and `rawi-judge.html` (the live trace).
Each experience page links to its character with `?ai=1` (`?perform=1` for the Samri teacher).
