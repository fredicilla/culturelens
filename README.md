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
├── index.html      — Home menu (3 category cards)
├── qahwa.html      — ☕ Najdi Qahwa experience + mini-game
├── masaqeel.html   — Al-Masaqil: 3D marble game with AR
├── sadu.html       — Al-Sadu: Bedouin weaving, 3D loom with AR + weaving race
├── samri.html      — Al-Samri: a Samri night in 3D with AR + rhythm game
└── style.css       — Shared styles
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
- One live 3D scene: a Samri night in the dunes, two rows of nine kneeling face to face on rugs, a mu'allim at the center of each, a fire at one end
- All the sound is made in code (samri-music.js): frame drums, claps, the slap of the drums thrown down, and hummed lines for the two rows. The beat runs on the audio clock, so the dancers, the cues and the scoring stay with what you hear
- History: where it began (Al-Qassim and Najd, and the Hasawi Samri of the Eastern Region), the two rows, the tar, the call and answer of the poetry (waneen, yisheel, marrad), and where it is sung today
- How it's performed, done with your fingers on the scene: take your seat at the end of the row (drag), tune your drum by wetting the skin (tap, rub), answer the first row (hold through your line), keep the beat (tap), sway right and left (swipe), then lift and lower the drums and slap them down with everyone
- Game: round 1 asks the mu'allim's 4 questions; round 2 is a whole Samri (heavy, then light and fast) where every passage you keep up with moves you one seat closer to the mu'allim
- AR on Android, Quick Look on iPhone
- Sources: Saudipedia; the Samri booklet of the Royal Institute of Traditional Arts (Wrth); Aramco World, "Saudi Folk Music: Alive and Well" (2007)

---

## 🔊 AUDIO NOTES
- All sounds generated via Web Audio API — no audio files needed
- Drum beats, success sounds, failure sounds — all built in
- **Must interact with page first** before audio works (browser requirement)
- On iOS: mute switch must be OFF

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
4. Open Al-Samri (Eastern Region): answer the first row, slap the drums down, then play a whole Samri and move up the row

**Talking point:** "PNU has students from all 13 regions of Saudi Arabia — CultureLens lets a student from Asir and a student from Najd learn each other's heritage through experience, not just text."

---

*CultureLens — عيش الثقافة، لا تقرأ عنها*
*Nourah Hackathon 2026 | تعزيز ثقافات المناطق*
