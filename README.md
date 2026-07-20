# whatstheviewlike — Wankhede 3D Seat-View Explorer

> An in-stadium experience simulation to visualize the live-match view you'll get before you buy those expensive af tickets.

An interactive 3D recreation of **Wankhede Stadium, Mumbai** for an **IPL 2026 MI vs RCB** night, built to answer the one question ticket apps never answer honestly: *what will the match actually look like from my seat?*

Open the app and you start over South Mumbai at sunset — the Arabian Sea, Marine Drive's Queen's Necklace, the Western Railway — then enter the stadium and drill down: **Stadium → Stand → Block → Seat**. Every one of ~25,000 seats is clickable and occupied by a fan; clicking one flies the camera to that seat's exact eye position.

## The honest-view engine

Every seat gets physics-based facts, not marketing:

- **Distance to pitch** and **height above ground** (Level 3 really is a ~30 m helicopter).
- **Boundary-net obstruction** — the mesh fence in front of Level 1 is modeled; only rows 1–4 sit behind it (calibrated against photo evidence), and those seats get a warning. Mid-L1 above the fence scores as what it really is: the best view in the house.
- **View score (0–100)** built on TV-broadcast logic: behind-the-arm alignment with the pitch axis is king, with a height sweet spot and penalties for square-on angles.
- **Player scale** — how much of your view a batter actually fills.
- Stars = **view rating only**. Facilities get a separate **PREMIUM** tag. Demand, sellout speed and 2024→2026 price history live in their own tracker.

Stand names, block letters, prices (from IPL 2025 BookMyShow grids extrapolated to 2026), MI's match-day dressing (fascia slogans, painted TATA IPL ground marks) and the city geography were all researched, not guessed.

## Stack

Vite + React + Three.js (react-three-fiber/drei), postprocessing bloom, procedural WebAudio crowd noise (no audio files), Rajdhani type. Everything is generated in code — no 3D model files, no textures on disk.

Concept inspired by [thebuggeddev/football-stadium](https://github.com/thebuggeddev/football-stadium) (StadiView); this project re-implements the ideas from scratch for cricket.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel           # accept defaults — Vite is auto-detected
vercel --prod
```

Or push to GitHub and "Import Project" on vercel.com — framework preset **Vite**, build `npm run build`, output `dist`.
