// Where Rawi, the CultureLens heritage agent, lives: the Supabase project that runs it.
// Both values are public by design: the anon key only lets the app call the agent and lets the judge view read
// the agent's recent steps; every table is locked behind row level security. A page can also be opened once with
// ?rawi=https://<project>.supabase.co&rawikey=<anon key> (remembered on that device) to try another project.
export const RAWI_SUPABASE_URL = 'https://vseveykskgjeimwtxjhp.supabase.co';
export const RAWI_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzZXZleWtza2dqZWltd3R4amhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzk3MDMsImV4cCI6MjExMDc1NTcwM30.TCuNwcXeUwFq9TaskmUSvAnAR7K6mlXHuc7q9A8OJwM';
