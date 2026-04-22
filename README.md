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
4. For the Samri gyroscope — **must use phone**, not laptop

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
├── ghutrah.html    — 🧵 Iqal & Ghutrah experience + mini-game
├── samri.html      — 🎶 Al-Samri 3D circle + rhythm game
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

### 🧵 Ghutrah (ghutrah.html)
- Story: Grandfather teaching Eid dressing ritual
- CSS animated figure that dresses up as story progresses
- Mini-game: Choose correct outfit for 3 occasions
  - Eid prayer, job interview, wedding
- Cultural facts unlocked per correct answer

### 🎶 Al-Samri (samri.html)
- **3D IMMERSIVE**: Three.js scene — you stand in center of Samri circle
- 12 animated figures swaying around a bonfire
- Tilt phone to look 360° around the circle (gyroscope)
- Drag finger to look around (touch fallback)
- 3 narrator panels tell the Al-Samri story
- Rhythm mini-game: Tap drum in time with the Tabl beat
- 3 verses, each faster — "Perfect / Good / Miss" timing

---

## 🔊 AUDIO NOTES
- All sounds generated via Web Audio API — no audio files needed
- Drum beats, success sounds, failure sounds — all built in
- **Must interact with page first** before audio works (browser requirement)
- On iOS: mute switch must be OFF

---

## 📱 DEVICE REQUIREMENTS
- **Chrome on Android**: Full support including gyroscope
- **Chrome on iOS**: Works, gyroscope requires permission prompt (tap OK)
- **Safari on iOS**: Works but gyroscope less reliable
- **Desktop laptop**: Works for Qahwa + Ghutrah; Samri 3D works but no gyroscope (drag to look)

---

## ⚠️ TROUBLESHOOTING

| Issue | Fix |
|-------|-----|
| Gyroscope not working | Tap screen first, check Chrome settings |
| Audio not playing | Tap/interact with page first — browser requires user gesture |
| 3D not loading | Check internet connection (Three.js loads from CDN) |
| Page blank | Open browser console (F12) — check for errors |
| Figures not visible | Ensure Three.js CDN loaded — needs internet |

---

## 🏆 FOR THE JUDGES DEMO

**Recommended demo flow:**
1. Show home screen — explain the 3 categories
2. Open Qahwa — tap through 2 story panels, do the mini-game
3. Open Ghutrah — show the dressed figure, do 1 occasion
4. Open Samri — enter the 3D circle, look around, play verse 1

**Talking point:** "PNU has students from all 13 regions of Saudi Arabia — CultureLens lets a student from Asir and a student from Najd learn each other's heritage through experience, not just text."

---

*CultureLens — عيش الثقافة، لا تقرأ عنها*
*Nourah Hackathon 2026 | تعزيز ثقافات المناطق*
