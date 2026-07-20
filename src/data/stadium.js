// ── Wankhede Stadium data model ─────────────────────────────────────────────
// Angles: degrees, 0° = North (the Tata End / North Stand), increasing
// clockwise viewed from above. East (90°) = Sunil Gavaskar Stand / railway
// side. South (180°) = Garware–MCA pavilion complex. West (270°) = Marine
// Drive / Sachin Tendulkar Stand side. The pitch runs north–south (Z axis).
//
// Layout, block letters and prices compiled from research on the real ground:
// BookMyShow MI-match seating grids (IPL 2025) extrapolated to an IPL 2026
// MI vs RCB marquee fixture, MCA/Mumbai Indians stand naming, and the 2011
// rebuild geometry (33,108 capacity, suspended PTFE roof, 4 corner masts).

export const FIELD_RX = 60   // east-west field semi-axis (m)
export const FIELD_RZ = 66   // north-south field semi-axis (m)
export const STAND_GAP = 6   // gap between boundary boards and first row

export const MATCH = {
  tournament: 'IPL 2026',
  home: 'Mumbai Indians',
  away: 'Royal Challengers Bengaluru',
  short: 'MI vs RCB',
  venue: 'Wankhede Stadium, Mumbai',
}

// Price tier colours — playful pastels: mint → sunny yellow → peach → coral → lilac
export const PRICE_TIERS = [
  { max: 2000, color: '#7ee8a2', label: 'Under ₹2k' },
  { max: 4000, color: '#ffd93d', label: '₹2k – 4k' },
  { max: 6000, color: '#ffa552', label: '₹4k – 6k' },
  { max: 12000, color: '#ff7b7b', label: '₹6k – 12k' },
  { max: Infinity, color: '#c9a0ff', label: '₹12k+ · Premium' },
]

export function priceColor(price) {
  for (const t of PRICE_TIERS) if (price <= t.max) return t.color
  return '#c9a0ff'
}

// crowd + MI brand palette (research: MI primary #004BA0, gold #D1AB3E)
export const SKIN_TONES = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#6b4423']
export const MI_BLUE = '#2b7fff'   // replica-jersey blue for the crowd
export const MI_NAVY = '#004ba0'   // official MI primary for dressing
export const MI_GOLD = '#ffd93d'

// Tier rake profiles (baseY = height of first row, baseR = radial offset of
// first row from the stand's inner edge). Heights are honest: Level 3 tops
// out ~30 m up — the "helicopter view" that ticket apps never warn you about.
export const LOWER = { baseY: 2.6, baseR: 0, rowDepth: 0.85, rowRise: 0.42 }     // Level 1
export const MID = { baseY: 10.8, baseR: 13.5, rowDepth: 0.85, rowRise: 0.55 }   // Level 2
export const UPPER = { baseY: 21, baseR: 26.5, rowDepth: 0.85, rowRise: 0.78 }   // Level 3/4 — genuinely vertigo-high

// `value` = VIEW rating only (5★ = behind the arm at net-clearing-to-mid
// height, the TV-camera view). `premium` = facilities tag (boxes, F&B, AC),
// independent of view. Demand lives in priceHistory/demand/selloutNote.
export const STANDS = [
  {
    id: 'north',
    name: 'North Stand',
    short: 'North',
    a0: -25, a1: 40,
    blocks: ['G', 'H', 'I', 'J', 'K'],
    tiers: [
      { name: 'Level 1', rows: 15, price: 3500, profile: LOWER, blocks: ['W', 'X', 'Y'] },
      { name: 'Level 3 · North Stand Gang', rows: 16, price: 4000, profile: UPPER, blocks: ['G', 'H', 'I', 'J', 'K'] },
    ],
    view: 'Tata End, straight behind the bowler’s arm under the giant screen. Level 3 blocks G–H are home of the North Stand Gang — the loudest crowd in Indian cricket.',
    value: 5, premium: false,
    priceHistory: { 2024: 2000, 2025: 3500, 2026: 4000 },
    demand: 5,
    selloutNote: 'Gang blocks vanish within minutes of general sale opening.',
  },
  {
    id: 'gavaskar',
    name: 'Sunil Gavaskar Stand',
    short: 'Gavaskar',
    a0: 40, a1: 125,
    blocks: ['A', 'B', 'C', 'D', 'E', 'F'],
    tiers: [
      { name: 'Level 1', rows: 15, price: 1500, profile: LOWER, blocks: ['G', 'H', 'I', 'J', 'K', 'L', 'M'] },
      { name: 'Level 2', rows: 12, price: 5000, profile: MID, blocks: ['A', 'B', 'C', 'D', 'E', 'F'] },
    ],
    view: 'East side against the railway tracks — the budget stand. Square-on sideways view of the pitch, catches plenty of sixes, but takes full afternoon sun.',
    value: 2, premium: false,
    priceHistory: { 2024: 800, 2025: 990, 2026: 1500 },
    demand: 5,
    selloutNote: 'Cheapest tickets in the ground — Level 1 is the first category to sell out.',
  },
  {
    id: 'divecha',
    name: 'Vitthal Divecha Stand',
    short: 'Divecha',
    a0: 125, a1: 155,
    blocks: ['A', 'B', 'C'],
    tiers: [
      { name: 'Level 1', rows: 15, price: 5500, profile: LOWER, blocks: ['A', 'B', 'C'] },
      { name: 'Level 3 · Rohit Sharma Stand', rows: 16, price: 4500, profile: UPPER, blocks: ['A', 'B', 'C'] },
    ],
    view: 'South-east corner — diagonal “cow corner” view with good afternoon shade. Its Level 3 was renamed the Rohit Sharma Stand in 2025.',
    value: 3, premium: false,
    priceHistory: { 2024: 3000, 2025: 3600, 2026: 4500 },
    demand: 4,
    selloutNote: 'The Rohit Sharma Stand rename made Level 3 a fan favourite — sells fast.',
  },
  {
    id: 'mca',
    name: 'MCA Pavilion',
    short: 'MCA',
    a0: 155, a1: 180,
    blocks: ['A', 'B'],
    tiers: [
      { name: 'Members Seating', rows: 15, price: 9000, profile: LOWER },
      { name: 'Corporate Boxes', rows: 4, price: 35000, profile: MID, blocks: ['Box 32', 'Box 36', 'Box 40', 'Box 44', 'Box 48'] },
    ],
    view: 'South end beside the dressing-room stairs — you watch the players walk out. Members’ enclosure with corporate hospitality boxes (F&B included) above.',
    value: 4, premium: true,
    priceHistory: { 2024: 6000, 2025: 8000, 2026: 9000 },
    demand: 2,
    selloutNote: 'Mostly members and hospitality — limited public sale.',
  },
  {
    id: 'grand',
    name: 'Grand Stand',
    short: 'Grand',
    a0: 180, a1: 202,
    blocks: ['A', 'B', 'C'],
    tiers: [
      { name: 'Level 1 · Ravi Shastri Stand', rows: 15, price: 8000, profile: LOWER },
      { name: 'Level 3 · Sharad Pawar Stand', rows: 12, price: 9500, profile: MID },
      { name: 'Level 4 · Ajit Wadekar Stand', rows: 14, price: 11000, profile: UPPER },
    ],
    view: 'Directly above the dressing rooms and the south sight screen, next to the press box — the view straight down the pitch from behind the bowler’s arm.',
    value: 5, premium: true,
    priceHistory: { 2024: 8000, 2025: 9200, 2026: 11000 },
    demand: 3,
    selloutNote: 'Small premium stand (~980 seats) — steady demand, holds longest of the premium tiers.',
  },
  {
    id: 'garware',
    name: 'Garware Pavilion',
    short: 'Garware',
    a0: 202, a1: 245,
    blocks: ['A', 'B', 'C', 'D'],
    tiers: [
      { name: 'Level 1', rows: 15, price: 6500, profile: LOWER, blocks: ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] },
      { name: 'Level 3', rows: 16, price: 5500, profile: UPPER, blocks: ['A', 'B', 'C', 'D'] },
    ],
    view: 'South-west — the high-profile pavilion with the grand entrance and President’s Box, near the dressing rooms. Close to the players, well shaded. Names the “Garware Pavilion End”.',
    value: 4, premium: true,
    priceHistory: { 2024: 4000, 2025: 4950, 2026: 6500 },
    demand: 4,
    selloutNote: 'Popular with regulars for shade and player proximity — goes in the members/priority window.',
  },
  {
    id: 'merchant',
    name: 'Vijay Merchant Stand',
    short: 'Merchant',
    a0: 245, a1: 285,
    blocks: ['A', 'B', 'C', 'D', 'E'],
    tiers: [
      { name: 'Level 1', rows: 15, price: 3000, profile: LOWER, blocks: ['F', 'G', 'H', 'I', 'J', 'K', 'L'] },
      { name: 'Level 2', rows: 12, price: 5000, profile: MID, blocks: ['A', 'B', 'C', 'D', 'E'] },
    ],
    view: 'West side facing Marine Drive — square-on view from behind point/cover, evening breeze off the Arabian Sea and afternoon shade. Excellent value.',
    value: 2, premium: false,
    priceHistory: { 2024: 2000, 2025: 2400, 2026: 3000 },
    demand: 4,
    selloutNote: 'Best price-to-comfort ratio in the ground — gone within the first hour.',
  },
  {
    id: 'tendulkar',
    name: 'Sachin Tendulkar Stand',
    short: 'Tendulkar',
    a0: 285, a1: 335,
    blocks: ['A', 'B', 'C', 'D', 'E', 'F'],
    tiers: [
      { name: 'Level 1', rows: 15, price: 5500, profile: LOWER, blocks: ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'] },
      { name: 'Level 2 · Premium', rows: 12, price: 11000, profile: MID, blocks: ['N', 'O', 'P'], a1: 325 },
      { name: 'Level 3', rows: 16, price: 4500, profile: UPPER, blocks: ['A', 'B', 'C', 'D', 'E', 'F'] },
    ],
    view: 'The huge north-west stand — the largest enclosure in the ground (with the North arc, a third of all seats). Near-straight views sweeping behind the arm, sea breeze, afternoon shade. Level 3 is superb value but very, very high.',
    value: 4, premium: false,
    priceHistory: { 2024: 3600, 2025: 4350, 2026: 5500 },
    demand: 5,
    selloutNote: 'The most searched stand on ticket apps — 58,900 “interested” for 33,100 seats last season.',
  },
  {
    id: 'vengsarkar',
    name: 'Dilip Vengsarkar Stand',
    short: 'Vengsarkar',
    a0: 325, a1: 335,
    blocks: ['L', 'M'],
    tiers: [
      { name: 'Level 2 · Premium', rows: 12, price: 20000, profile: MID, blocks: ['L', 'M'] },
    ],
    view: 'The premium Level 2 enclosure beside the Sachin Tendulkar Stand — near behind-the-arm at mid height: the finest view in the ground, with premium facilities to match.',
    value: 5, premium: true,
    priceHistory: { 2024: 12000, 2025: 15000, 2026: 20000 },
    demand: 3,
    selloutNote: 'Priciest public seats — 65% price jump since 2025, still sells out for marquee games.',
  },
]

// quick lookups
export const STAND_BY_ID = Object.fromEntries(STANDS.map(s => [s.id, s]))
export function standPriceRange(stand) {
  const prices = stand.tiers.map(t => t.price)
  return [Math.min(...prices), Math.max(...prices)]
}

// Protective fence/netting in front of the Level 1 rows. Photo evidence
// (imgs/image_level1.png) shows only the first ~4 rows sit behind the mesh;
// everything above clears it — which is exactly why mid-L1 is the most
// premium view in the house. (Fan guides claim 5–7 rows; the photo wins.)
export const NET_TOP = 4.4      // top of the fence/net, metres → rows 1–4 obstructed
export const NET_OFFSET = -3.5  // radial offset from stand inner edge (toward field)

// Honest physics for a seat's view: distance, height, whether the sightline
// to the pitch passes through the net, and a 0–100 view score built on the
// TV-broadcast logic — best seat is "on the straights" (aligned with the
// pitch axis), above the fence but below mid height.
export function computeViewFacts(seat) {
  const p = seat.position
  const eyeY = p.y + 1.18
  const d = Math.hypot(p.x, p.z)
  const a = Math.atan2(p.x, -p.z)
  const netR = Math.hypot(
    Math.sin(a) * (FIELD_RX + STAND_GAP + NET_OFFSET),
    Math.cos(a) * (FIELD_RZ + STAND_GAP + NET_OFFSET)
  )
  // sightline from eye to a batsman's torso (~0.8 m) at the pitch centre
  const sightHeightAtNet = 0.8 + (eyeY - 0.8) * (netR / d)
  const netObstructed = sightHeightAtNet < NET_TOP
  // apparent size of a 1.8 m player from this seat, as % of a 52° tall frame
  const dist3D = Math.sqrt(d * d + eyeY * eyeY)
  const playerAngle = (2 * Math.atan(0.9 / dist3D) * 180) / Math.PI
  const playerSizePct = Math.round((playerAngle / 52) * 100 * 10) / 10

  const distPenalty = Math.min(1, Math.max(0, (d - 60) / 60)) * 25
  const squarePenalty = Math.abs(Math.sin(a)) * 18
  let heightPenalty = 0
  if (eyeY < 5) heightPenalty = (5 - eyeY) * 2.5
  else if (eyeY > 16) heightPenalty = Math.min(26, (eyeY - 16) * 1.7)
  const netPenalty = netObstructed ? 30 : 0
  const score = Math.round(Math.max(5, 100 - distPenalty - squarePenalty - heightPenalty - netPenalty))

  const sinA = Math.abs(Math.sin(a))
  const aligned = sinA < 0.45
  let label
  if (netObstructed) label = 'You will watch the match through the safety net'
  else if (score >= 85) label = aligned ? 'Behind the arm, perfect height — the TV-camera view' : 'Superb — right on top of the action'
  else if (score >= 70) label = 'Great view — players clearly visible'
  else if (score >= 55) label = aligned ? 'Straight view, but the height dilutes it' : 'Decent, but a side-on angle'
  else if (score >= 40) label = 'High up or square-on — players start to look small'
  else label = 'Bird’s-eye / helicopter view — players look tiny'

  // where you sit relative to the pitch axis
  let angleDesc
  if (aligned) angleDesc = 'You watch from behind the bowler’s arm — the broadcast-camera angle.'
  else if (sinA > 0.82) angleDesc = 'You watch side-on, from an angle parallel to the pitch.'
  else angleDesc = 'You watch diagonally, from the cover / cow-corner region.'

  // What the view actually feels like. playerAngle (how many degrees of your
  // vision a batter occupies) drives the comparison — a fingernail held at
  // arm's length covers about 1° — so the words follow the physics.
  let relatable
  if (netObstructed) relatable = 'You are at the players’ level, but peering through the boundary mesh.'
  else if (playerAngle >= 1.25)
    relatable = 'You’re nearly at the players’ level — a batter looks bigger than a fingernail at arm’s length. Close enough to read stances and pick the ball off the bat.'
  else if (playerAngle >= 1.02)
    relatable = 'Like the balcony of a movie hall — a batter is about a fingernail tall at arm’s length. Every shot is readable; the big screen fills in the faces.'
  else
    relatable = 'Like looking down at the street from the 30th floor — a batter is smaller than a fingernail at arm’s length. Your favourite cricketers become tiny figures below.'

  return { distance: Math.round(d), height: Math.round(eyeY), netObstructed, playerSizePct, score, label, angleDesc, relatable }
}
