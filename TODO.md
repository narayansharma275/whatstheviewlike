# Wankhede 3D — Build Tracker

Living checklist of everything requested, shipped, in flight, or parked.
(Last updated: 19 Jul 2026, this session)

## ✅ Latest round

- [x] Budget bills simplified to exactly ₹2,000 / ₹5,000 / ₹10,000 / ₹15,000+ — single-select, top-3 picks appear on selection
- [x] Compare selections now made from the right-hand stands panel (block chips), not by clicking the 3D bowl; 3D seat clicks inert while picking
- [x] Block focus locks seat clicking to that block only — no accidental picks from neighbouring stands
- [x] Hover in block view shows the ticket-style seat name ("Seat F12 · Row F · ₹4,500"); visual row-letter markers removed on request
- [x] Level 3 block camera stays LOW, looking up at the rake (OrbitControls polar clamp was silently lifting it — fixed); seat eye leans forward so the canopy stays out of frame on top rows

## ✅ Done

- Procedural Wankhede: correct 9 stands (Vengsarkar = premium L2 enclosure; Divecha L3 = Rohit Sharma Stand; Grand L1/L3/L4 = Shastri/Pawar/Wadekar), per-level block letters from BookMyShow research
- Researched IPL 2025→2026 price grid per stand-tier; price-history + demand + sellout notes per stand
- Explorer drill-down: Stadium → Stand → Block with camera flights; back-navigation
- Seat POV with look-around (fixed the "yanked to pitch" OrbitControls bug)
- Honest view engine: distance / height / view score (TV-camera logic: behind-the-arm + height sweet spot + square-on penalty)
- Boundary mesh modeled; obstruction calibrated to photo evidence (L1 rows 1–4 only); mid-L1 scores as premium
- Stars = view rating only; PREMIUM = separate facilities tag (Vengsarkar corrected to 5★)
- Relatable view copy ("30th floor" / "movie-hall balcony" / "players' level") + angle line (behind-the-arm / side-on / diagonal) replacing raw percentages
- Packed crowd in every seat (instanced, deterministic), ~80% MI blue + RCB red pocket, own seat empties in POV
- Animated match loop (run-up → delivery → six/drive/pull, running batsmen, chasing fielder) + live-ticking analog scoreboard
- Procedural crowd audio + cheer synced to bat-on-ball + UI hover/select blips + mute button (SVG icons, no emojis)
- MI dressing: fascia slogans (AALA RE / DUNIYA HILA DENGE HUM), MI-blue LED boundary, TATA IPL painted both ends on pitch axis, Dream11 + MI Paltan midwicket decals (mirrored-text bug fixed)
- Sunset scene: sky dome, sun + bloom, golden light; light-mode game-style UI (Rajdhani font)
- South Mumbai cityscape: blue Arabian Sea (fog-proofed) + glint + boats, Marine Drive + Queen's Necklace + moving cars, 4-track railway + moving local train, university oval, gymkhanas, Brabourne, Rajabai Tower, Nariman Point + Malabar Hill towers, palms, plaza, ribbed facade
- City intro ("Fortress Wankhede" + Enter) with idle auto-rotation everywhere
- Bidirectional hover: 3D hover → chip + tracker; explorer hover → stand/block glows in 3D
- Bloom + ACES tone mapping; z-fighting/flicker fix (log depth buffer + water layering)
- L3 raised (real vertigo); Level 3 relatable = "street from the 30th floor"

## ✅ Shipped in the latest pass

- [x] Price-range navigator (bottom-left): single-select band → matching sections stay vivid, everything else (seats + crowd) fades to gray, game-style
- [x] Block-zoom step: block click zooms INTO the block; you pick the exact seat by clicking it; row letters as on tickets (Seat D7 = Row D) + per-block mesh warning (rows A–D)
- [x] Best-seat-for-my-budget widget: preset price bills → top-3 stand/tier/block picks ranked by view score, click-to-fly, prototype note
- [x] Compare mode (tabs EXPLORE | COMPARE): pick up to 3 blocks by clicking seats → chips → arrow-cycle their centroid views with snapshot + exit
- [x] Snapshot & share (canvas capture + MI-blue seat-info banner → Web Share sheet or PNG download)
- [x] Relatable view copy driven by real angular size (fingernail-at-arm's-length heuristic) + side-on/behind-the-arm angle line; percentages removed from UI
- [x] Roof raised so top L3 rows are never ceiling-obstructed; L3 height feels true
- [x] Crowd rebalanced ~80% MI blue + small RCB red pocket (no more CSK yellow)
- [x] Ground marks: TATA IPL behind both ends only (Dream11/MI decals removed on request)
- [x] Sea made unmistakably blue (fog-exempt water), flicker fixed (log depth buffer + layering)
- [x] Scoreboard aligned on a clean label/tile grid

## ✅ Beacon (from game-UX research)

- [x] Wide curved **light-curtain beacon**: rises from the top of a whole stand's arc (or one block's sub-arc), fades out above the roof, soft pulse, colored by price band. Shows on panel-hover (stadium/stand level) and for all compare picks so selections stay findable across the bowl.

## 🅿️ Parked / ideas (not started)

- Shareable seat URLs (?stand=&block=&row=) for the Twitter launch
- Row quick-buttons (front/middle/back) inside block zoom
- Day-match mode (sun/shade economics per stand)
- Availability simulation + "selling fast" states on blocks
- Other game-UX highlights: proxy-shell rim glow, scrolling perimeter ribbon (beacon done)
- Mobile touch pass
- Chinnaswamy Stadium as stadium #2
