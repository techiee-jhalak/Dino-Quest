# Dino Quest

A responsive, classroom-friendly endless runner built with HTML5 Canvas, CSS, and vanilla JavaScript. The supplied Little Dino Run was the starting point for the runner physics, hand-drawn dinosaur, and layered scenery.

## Run locally or on Replit

Open `index.html` in a browser, or import this folder into Replit and choose **Static** as the project type. No build step or package installation is needed. The Google Fonts link is optional; the page falls back to system fonts when offline.

The repository also includes a small Caddy-based Docker deployment for Railway. Railway can build the included `Dockerfile` and serve the static game on its assigned port.

## Project files

- `index.html` — game layout, HUD, menus, and controls
- `style.css` — responsive dark interface and canvas overlays
- `script.js` — canvas runner, progression, power-ups, sound, and local high-score storage
- `questions.js` — editable multiple-choice question bank (answer indices are zero-based)
- `assets/` — reserved for optional local art and sound assets; core game art and audio are drawn/synthesized in-browser

Controls: Space or ↑ to jump, ↓ to drop faster while airborne, P or Escape to pause. Touch the game area to jump on mobile.
