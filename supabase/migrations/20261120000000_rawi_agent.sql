-- Rawi, the CultureLens heritage agent: what it remembers, what it measured, what it did.
-- Every write goes through the Edge Function (service role). The browser never touches these tables
-- directly, except the judge view, which may read the agent's recent steps (traces) live.

create extension if not exists vector with schema extensions;

-- a learner is a device (a random key the app keeps in localStorage); no names unless they say one
create table if not exists public.learners (
  id uuid primary key default gen_random_uuid(),
  device_key text unique not null,
  lang text not null default 'ar',
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

-- one visit to one experience (samri, qahwa, sadu, masaqil, ...); state holds the agent's plan and short history
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  experience text not null,
  state jsonb not null default '{}'::jsonb,
  turns int not null default 0,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sessions_learner on public.sessions (learner_id, started_at desc);

-- what Rawi decided to remember about a learner, across every experience
create table if not exists public.memories (
  id bigserial primary key,
  learner_id uuid not null references public.learners(id) on delete cascade,
  experience text,
  kind text not null check (kind in ('name', 'likes', 'skill', 'mistake', 'milestone', 'note')),
  content text not null check (char_length(content) <= 300),
  importance smallint not null default 2 check (importance between 1 and 5),
  created_at timestamptz not null default now()
);
create index if not exists memories_learner on public.memories (learner_id, importance desc, created_at desc);

-- every measured try: the numbers came from the phone (timing, strikes) and from the ear (Whisper)
create table if not exists public.attempts (
  id bigserial primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  experience text not null,
  skill text not null,
  metrics jsonb not null default '{}'::jsonb,
  score real,
  created_at timestamptz not null default now()
);
create index if not exists attempts_learner_skill on public.attempts (learner_id, skill, created_at desc);

-- each step of each agent turn: input, model call, tool call, tool result, reply. The judge view streams these
create table if not exists public.traces (
  id bigserial primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  experience text not null,
  turn int not null,
  step int not null,
  kind text not null,
  name text,
  payload jsonb,
  ms int,
  created_at timestamptz not null default now()
);
create index if not exists traces_session on public.traces (session_id, id);
create index if not exists traces_recent on public.traces (created_at desc);

-- the heritage the agent may cite: the passages the team wrote for each experience, with their sources
create table if not exists public.knowledge (
  id bigserial primary key,
  experience text not null,
  title text,
  content_en text not null,
  content_ar text,
  source text,
  embedding extensions.vector(384)
);
create index if not exists knowledge_embedding on public.knowledge using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.match_knowledge(query_embedding extensions.vector(384), match_count int default 4, exp text default null)
returns table (id bigint, experience text, title text, content_en text, content_ar text, source text, similarity float)
language sql stable
set search_path = public, extensions
as $$
  select k.id, k.experience, k.title, k.content_en, k.content_ar, k.source,
         1 - (k.embedding <=> query_embedding) as similarity
  from public.knowledge k
  where k.embedding is not null and (exp is null or k.experience = exp or k.experience = 'general')
  order by k.embedding <=> query_embedding
  limit match_count;
$$;

-- locked down: no policies means the anon key can do nothing, the Edge Function (service role) does everything
alter table public.learners enable row level security;
alter table public.sessions enable row level security;
alter table public.memories enable row level security;
alter table public.attempts enable row level security;
alter table public.knowledge enable row level security;
alter table public.traces enable row level security;

-- except the judge view: it may read the last six hours of agent steps (no names, no audio, just what the agent did)
drop policy if exists "judge view reads recent traces" on public.traces;
create policy "judge view reads recent traces" on public.traces
  for select to anon using (created_at > now() - interval '6 hours');

-- new projects may not grant table access to the API roles by default: say it outright
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on function public.match_knowledge(extensions.vector, int, text) to service_role;
grant select on public.traces to anon;

-- live updates for the judge view
do $$ begin
  alter publication supabase_realtime add table public.traces;
exception when duplicate_object then null; when undefined_object then null;
end $$;
