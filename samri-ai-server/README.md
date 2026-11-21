# AI Samri server

The small server behind "A Samri on any topic", the chapter near the end of the Samri story in `samri.html`. You type a topic, Claude writes two abyat of Najdi Samri on it, the server checks they fit the rhythm the rows sing, and then it sings every half in the two rows' voices so the men on screen perform it.

The app works without it. The six topic chips (the palm, coffee, rain, the falcon, a night of samar, the homeland) ship with the app, already written and sung, so they play with no server and no internet. The server is only for topics people type.

## How it works

- `POST /compose {"topic": "البحر"}` asks Claude for the poem. Claude answers through a tool with a fixed shape: the Arabic text of every half plus its 12 sung syllables in a Latin spelling, with marks for where each word starts. `samri_verse.py` checks the meter (L L S L, L L S L, L S L L, the pattern of يا جر قلبي جر لدن الغصوني), the two rhymes and the word marks. If anything is off, the problems go back to Claude and it fixes them, up to 4 tries. Unsuitable topics (offensive, political, real people, brands...) are refused.
- `POST /sing {"half": ..., "part": "sadr" | "ajz", "row": 0 | 1}` sings one half as one row. An Arabic text-to-speech voice says the words, then WORLD moves every syllable onto its pulse, holds the vowels and sets them on the tune; three takes by two singers each make the row. It answers with an mp3. The app asks for the 8 halves of a poem two at a time and the rows start as soon as the first verse is ready.
- `GET /health` says it's up, which model it uses, and whether it's in test mode.

Without an API key (or with `SAMRI_MOCK=1`) the server runs in test mode: `/compose` answers from the six shipped poems, so you can try the singing for free.

## Files

| File | What it is |
|---|---|
| `app.py` | the web server (FastAPI): the endpoints, limits, cache |
| `compose.py` | the Claude call: the prompt, the tool, the retry loop |
| `samri_verse.py` | the meter, the rhyme and the spelling, and the checker |
| `samri_sing.py` | the singer |
| `get_voice.py` | downloads the voice into `models/` (about 60 MB, once) |
| `poems.json` | the six shipped poems; `make_bank.py` writes it |
| `sing_bank.py`, `clips.json` | sing the shipped poems into `../samri-ai/*.mp3` and `../samri-ai.js` |
| `Dockerfile` | the same thing as one container |

## Run it on your computer

You need Python 3.10 to 3.13. On Windows pip finds ready-made packages for everything. On Mac and Linux it has to compile `pyworld`, so you need a C compiler (Xcode command line tools, or `build-essential`), or use Docker instead.

```
cd samri-ai-server
pip install -r requirements.txt
python get_voice.py
python -m uvicorn app:app --port 7860
```

That's test mode. For real poems, set your Anthropic API key first (make one at console.anthropic.com):

```
PowerShell:    $env:ANTHROPIC_API_KEY="sk-ant-..."
cmd:           set ANTHROPIC_API_KEY=sk-ant-...
Mac / Linux:   export ANTHROPIC_API_KEY=sk-ant-...
```

Then serve the app the usual way (VS Code Live Server on port 5500, or `python -m http.server 8000` in the main folder) and open it with the server's address after `?ai=`:

```
http://localhost:5500/samri.html?ai=http://localhost:7860
```

Tap through the story to "A Samri on any topic": the topic box shows under the chips. The page remembers the address on that device; `?ai=off` forgets it.

With Docker instead of Python:

```
docker build -t samri-ai .
docker run -p 7860:7860 -e ANTHROPIC_API_KEY=sk-ant-... samri-ai
```

## Demo day: a laptop, open to the internet

The live site is https, so it can only talk to an https server. The quickest way to get one for a demo is to run the server on a laptop (above) and open a Cloudflare quick tunnel to it. It's free and needs no account:

```
winget install --id Cloudflare.cloudflared      (Mac: brew install cloudflared)
cloudflared tunnel --url http://localhost:7860
```

It prints an address like `https://some-random-words.trycloudflare.com`. Open this on any phone:

```
https://fredicilla.github.io/culturelens/samri.html?ai=https://some-random-words.trycloudflare.com
```

The address changes every time you start the tunnel, and Cloudflare makes no uptime promise for quick tunnels, so keep the laptop awake and plugged in, and test it an hour before.

## Putting it online for good

The singing needs real CPU: about 2 seconds of one core per half, so 2 cores keep up with the rows. Hosts that give a small slice of a CPU will be too slow (set `SAMRI_TAKES=1` there and the singing gets about three times faster, with a thinner row).

**Google Cloud Run** has a monthly free tier of 180,000 vCPU-seconds, 360,000 GiB-seconds and 2 million requests. A poem takes very roughly 70 vCPU-seconds with the settings below (most of it waiting for Claude), so a couple of thousand poems a month should fit. It needs a Google Cloud account with billing turned on. With the gcloud CLI, in this folder:

```
gcloud run deploy samri-ai --source . --region europe-west1 --cpu 2 --memory 2Gi --max-instances 2 --allow-unauthenticated --set-env-vars ALLOWED_ORIGINS=https://fredicilla.github.io,SAMRI_WORKERS=2,ANTHROPIC_API_KEY=sk-ant-...
```

Any region works. Putting the key in Secret Manager (`--set-secrets ANTHROPIC_API_KEY=your-secret:latest`) keeps it out of the service settings, which is better once more people have access to the project.

**Hugging Face Spaces**: make a new Space with the Docker SDK and upload this folder. Its README needs this at the top:

```
---
title: CultureLens AI Samri
sdk: docker
app_port: 7860
---
```

and the key goes in the Space settings as a secret named `ANTHROPIC_API_KEY`. The address will be `https://<user>-<space>.hf.space`. Heads up: since July 2026 people on the Hugging Face forum report that new Docker Spaces on the free CPU need a PRO account, so check before counting on it.

## Connecting the app

Put the server's address in `AI_URL` at the top of `samri-ai.js`:

```js
export var AI_URL = 'https://samri-ai-xxxxx.europe-west1.run.app';
```

Now the topic box shows for everyone. The site's address has to be in the server's `ALLOWED_ORIGINS` (it is by default for fredicilla.github.io and the usual local ports).

## Settings

| Setting | Default | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | none | your key; without it the server is in test mode |
| `SAMRI_MODEL` | `claude-sonnet-5-5` | the Claude model that writes the poems |
| `SAMRI_TRIES` | 4 | tries before giving up on a poem that doesn't fit |
| `ALLOWED_ORIGINS` | the live site and local ports | sites allowed to call the server, comma separated |
| `SAMRI_PER_HOUR` | 20 | poems per visitor per hour |
| `SAMRI_PER_DAY` | 150 | poems for everyone per day, a cap on the API bill |
| `SAMRI_SING_PER_HOUR` | 200 | sung halves per visitor per hour (a poem is 8) |
| `SAMRI_TAKES` | 3 | takes per row; fewer is faster and thinner |
| `SAMRI_WORKERS` | CPU count | halves sung at the same time |
| `SAMRI_MOCK` | off | `1` forces test mode |
| `PORT` | 7860 | the port (Cloud Run sets it itself) |

## Cost

Only `/compose` costs money; the singing is just CPU. One try sends Claude about 2,500 tokens (the instructions, the example and the tool) and gets about 1,000 back. Sonnet 5.5 was reported at launch at $2 per million input tokens and $10 per million output tokens (check Anthropic's pricing page for the current numbers), so that's about 1.5 US cents a try. Most poems should need one or two tries; the worst case, 4 tries, is about 8 cents. The daily cap of 150 poems keeps a bad day under about 12 dollars. Setting a monthly spend limit in the Anthropic Console as well is a good idea.

## Things to know

- **The verses need a person.** The code checks the meter, the rhymes and the word marks, but nothing checks the meaning, the dialect or the taste. The six shipped poems were written by AI and need a native speaker's review (Dr. Abad) before the app goes beyond the hackathon; typed-topic poems are a demo.
- **The live Claude call hasn't been run yet.** The retry loop was tested through the real Anthropic SDK against a fake API, and everything else end to end in test mode, but no real key was used. Try a few topics before demo day. If Sonnet struggles with the meter, `SAMRI_MODEL=claude-opus-5-5` is worth a try (it costs more).
- **The voice is a machine voice** (Arabic text-to-speech set to the tune), not recordings of a group. It's Piper's "ar_JO-kareem" voice; its model card points to github.com/AliMokhammad/arabicttstrain for the license, which I couldn't open from here. Check it before any use beyond the hackathon.
- **The key stays on the server.** The app never sees it. `ALLOWED_ORIGINS` only stops other websites from calling the server in a browser, not scripts, which is why the limits and the daily cap are there.
- **`?ai=` works for any address**, so a link can point someone's page at a different server. The page shows whatever comes back as plain text and checks its shape, so the worst a bad server can do is show a bad poem.
- **After fixing a shipped poem** in `make_bank.py`: `python make_bank.py`, then `python sing_bank.py palm` (the topic you changed) sings it again and updates `../samri-ai/palm.mp3` and `../samri-ai.js`.
