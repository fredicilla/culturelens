# CultureLens — Setup & Run Guide
## هاكاثون نورة 2026 | تعزيز ثقافات المناطق

---

## ▶️ HOW TO RUN LOCALLY (2 minutes)

### Option A — VS Code (Recommended)
1. Open VS Code
2. Install the **Live Server** extension (search in Extensions panel)
3. Open the `culturelens/` folder in VS Code
4. Right-click `index.html` → **Open with Live Server**
5. Opens at `http://localhost:5500` — works immediately

### Option B — Python (no install needed)
```bash
cd culturelens
python3 -m http.server 8080
```
Then open `http://localhost:8080` in Chrome.

---

## 📱 TEST ON YOUR PHONE (same WiFi)

1. Find your laptop's local IP:
   - Mac: `ifconfig | grep "inet "` → look for 192.168.x.x
   - Windows: `ipconfig` → look for IPv4 Address
2. On your phone, open Chrome
3. Go to `http://192.168.x.x:5500` (or 8080)
4. AR (Masaqil, Al-Sadu, Al-Samri) needs a phone and an https link, so use the Netlify link below for it. Everything else works over plain http

---

## 🌐 DEPLOY ONLINE (share a link in 2 minutes)

### Netlify Drop (Free, instant)
1. Go to **netlify.com/drop**
2. Drag the entire `culturelens/` folder onto the page
3. Get a live URL instantly (e.g. `https://random-name.netlify.app`)
4. Share this link with judges

---

## 📁 FILE STRUCTURE

```
culturelens/
├── index.html      — The region map, then the region's home
├── food.html, music.html, games.html, clothing.html — the four categories
├── experience.html — One experience: its story, how it's made, and the way in
├── community.html, account.html
├── app.css         — The look of all the pages above (paper and ink, region colors)
├── logo.svg, logo-mark.svg, logo-h-en.svg, logo-h-ar.svg — the logo, its mark, and the header versions
├── cover-*.jpg     — Pictures of the four full experiences, taken from their own scenes
├── qahwa.html      — ☕ Najdi Qahwa experience + mini-game
├── masaqeel.html   — Al-Masaqil: 3D marble game with AR
├── sadu.html       — Al-Sadu: Bedouin weaving, 3D loom with AR + weaving race
├── samri.html      — Al-Samri: a Samri night in 3D with AR + rhythm game
└── style.css, ui.css, studio.css — Shared styles of the four full experiences
```

---

## 🎮 WHAT EACH EXPERIENCE DOES

### ☕ Qahwa (qahwa.html)
- Immersive Najdi majlis story — 5 narration panels
- Tap through the cultural story of Saudi coffee ceremony
- Mini-game: Serve 4 guests in correct order (eldest first)
- Pour the correct amount (¼ cup only)
- Rules revealed as you serve correctly

### Al-Sadu (sadu.html)
- One live 3D scene: a Bedouin house of hair at dusk with a ground loom on the sand
- History: the fibers, the colors, the patterns and their names, UNESCO
- How it's made, done with your fingers on the scene: pick the thorns out of the wool (tap), comb it with the kirdash (swipe left and right), spin it (roll the spindle up, let it drop), dye it (drag white yarn into the pot, lift it at the right shade), drive the stakes (tap), lay the warp (drag the ball beam to beam), weave (up to open, across to pass the mishaʿ, down to beat with the minshaza), and pick up the tree thread by thread in a close-up of the warp (AR on Android, Quick Look on iPhone)
- Game: round 1 reads a Sadu (4 questions); round 2 races Grandma Haya to the end of a band with the real weaving rhythm, faster each time you win

### Al-Samri (samri.html)
- One live 3D scene: a Samri night in the dunes, two rows of nine kneeling face to face on rugs, a mu'allim at the center of each (in a bisht), a fire at one end. The men are drawn in code: faces with beards, a shemagh and igal that lie on the head and shoulders, hands that land on the drum, and mouths that move with the words they sing
- The sound is played on the beat by samri-music.js from one file, samri-sounds.mp3, with the real Samri rhythms: the heavy Samri of Unaizah (one stroke on its own, then three in a row) and the light Samri of the rest of Najd (two strokes in a row, then one), the big marjaf drum, claps, and the slap of the drums thrown down. The beat runs on the audio clock, so the dancers, the cues and the scoring stay with what you hear
  - Drums and claps: real recordings of frame drums, a bass drum and hand claps from the Versilian Community Sample Library (VCSL, Versilian Studios, CC0 / public domain), layered into a row of men striking together
  - Singing: a machine voice, not a recording of a Samri group. An Arabic text-to-speech voice (Piper "ar_JO-kareem") says the verse in the Najdi way, and each syllable is put on the rhythm, held and tuned (WORLD vocoder), seven times over to make a row. The tune is ours, in the style, not a transcription. To be replaced by a real group when one can be recorded
- The poem is a real Samri verse: يا جر قلبي جر لدن الغصوني / وغصون سدر جرها السيل جرا (one of the best-known Samri poems, attributed to the 19th-century poet Dakhilallah al-Dujaima). The rows sing it half by half, and each word lights up on screen as it is sung
- History: where it began (Al-Qassim, in Najd), the two rows, the drums and both rhythms (tap Heavy or Light to hear them), the call and answer of the poetry (waneen, yisheel, marrad) with the verse, and where it is sung today
- How it's performed, done with your fingers on the scene: take your seat at the end of the row (drag), tune your drum by wetting the skin (tap, rub), sing the line back (hold through your half of the verse), play the beat of Unaizah (tap on every stroke), sway right and left (swipe), then lift and lower the drums on the leader's call and slap them down with everyone
- Game: round 1 asks the mu'allim's 4 questions; round 2 is a whole Samri, heavy then light, where you clap with the drum strokes when your row sings and every passage you keep up with moves you one seat closer to the mu'allim
- AR on Android, Quick Look on iPhone
- Sources: Saudipedia; the Samri booklet of the Royal Institute of Traditional Arts (Wrth); Aramco World, "Saudi Folk Music: Alive and Well" (2007); Abdulaziz bin Hamad Al-Qadi, "Samri Unaizah", Al-Jazirah (2 Nov 2025); Al-Jazirah, "Samri" (17 Oct 2016); Al-Manwar, "The Samri tradition in Saudi Arabia" (2025); the Saudi Heritage Preservation Society, for the verse

---

## 🔊 AUDIO NOTES
- Sounds are played with the Web Audio API. Qahwa, Al-Masaqil and Al-Sadu make theirs in code, with no audio files
- Al-Samri plays recorded drums and claps and a sung verse from samri-sounds.mp3 (see its section), and falls back to sounds made in code if that file cannot be loaded
- **Must interact with page first** before audio works (browser requirement): the first tap anywhere starts it
- On iPhone, Al-Samri asks to play as media, so it should sound even with the silent switch on (iOS 16.4 and later; older ones use a silent track for the same effect)

---

## 📱 DEVICE REQUIREMENTS
- **Chrome on Android**: Full support, including AR
- **iPhone**: Works; AR opens in AR Quick Look
- **Desktop laptop**: Everything except AR (drag to look around the 3D scenes)

---

## ⚠️ TROUBLESHOOTING

| Issue | Fix |
|-------|-----|
| AR button greyed out | AR needs a phone and an https link |
| Audio not playing | Tap/interact with page first — browser requires user gesture |
| 3D not loading | Check internet connection (Three.js loads from CDN) |
| Page blank | Open browser console (F12) — check for errors |
| Figures not visible | Ensure Three.js CDN loaded — needs internet |

---

## 🏆 FOR THE JUDGES DEMO

**Recommended demo flow:**
1. Show home screen — explain the 3 categories
2. Open Qahwa — tap through 2 story panels, do the mini-game
3. Open Al-Sadu (Northern Region) — weave a few rows and pick up the tree, then race Grandma Haya
4. Open Al-Samri (Najd): hear the heavy and light beats, sing the verse back, slap the drums down, then play a whole Samri and move up the row

**Talking point:** "PNU has students from all 13 regions of Saudi Arabia — CultureLens lets a student from Asir and a student from Najd learn each other's heritage through experience, not just text."

---

*CultureLens — عيش الثقافة، لا تقرأ عنها*
*Nourah Hackathon 2026 | تعزيز ثقافات المناطق*
