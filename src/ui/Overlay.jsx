import React, { useMemo } from 'react'
import { MATCH, PRICE_TIERS, STANDS, STAND_BY_ID, priceColor, standPriceRange, computeViewFacts } from '../data/stadium.js'
import { findBlockSeat, seatCode } from '../components/Stadium.jsx'
import { shareSnapshot } from './snapshot.js'
import crowd from '../audio/crowd.js'

const inr = n => '₹' + n.toLocaleString('en-IN')

const SpeakerIcon = ({ muted }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
    {muted ? (
      <>
        <line x1="16" y1="9" x2="22" y2="15" />
        <line x1="22" y1="9" x2="16" y2="15" />
      </>
    ) : (
      <>
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 6a9 9 0 0 1 0 12" />
      </>
    )}
  </svg>
)

const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

const StarRow = ({ n }) => (
  <span className="stars" title={`View rating: ${n}/5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} width="13" height="13" viewBox="0 0 24 24" className={i < n ? 'star-on' : 'star-off'}>
        <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2l-6.1 3.4 1.4-6.8L2.2 9.1l6.9-.8z" fill="currentColor" />
      </svg>
    ))}
  </span>
)

const DemandMeter = ({ n }) => (
  <span className="demand-bars" title={`Demand: ${n}/5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={'dbar' + (i < n ? ' dbar-on' : '')} />
    ))}
  </span>
)

export default function Overlay(props) {
  const {
    explorer, selectedSeat, hoveredSeat,
    onGoStadium, onGoStand, onGoBlock, onHoverTarget,
    muted, onToggleMute,
    priceFilter, onPriceFilter,
    mode, onMode,
    compareSel, compareIdx, onAddCompare, onStartCompare, onStopCompareView, onCompareIdx, onRemoveCompareSel,
  } = props

  const contextStand =
    explorer.level === 'stand' || explorer.level === 'block' || explorer.level === 'seat'
      ? STAND_BY_ID[explorer.standId]
      : hoveredSeat ? hoveredSeat.stand
      : null

  const isCity = explorer.level === 'city'
  const comparePicking = mode === 'compare' && compareIdx == null
  const compareViewing = mode === 'compare' && compareIdx != null

  return (
    <div className="overlay">
      <button className="sound-btn" onClick={onToggleMute} title={muted ? 'Unmute stadium sound' : 'Mute stadium sound'}>
        <SpeakerIcon muted={muted} />
      </button>

      <header className="header">
        <div className="title-row">
          <span className="badge">IPL 2026</span>
          <h1>{MATCH.short}</h1>
        </div>
        <p className="venue">{MATCH.venue}</p>
        <p className="teams">{MATCH.home} vs {MATCH.away}</p>
      </header>

      {!isCity && (
        <nav className="mode-tabs">
          <button
            className={'mode-tab' + (mode === 'explore' ? ' mode-tab-on' : '')}
            onClick={() => { crowd.uiSelect(); onMode('explore') }}
          >
            EXPLORE
          </button>
          <button
            className={'mode-tab' + (mode === 'compare' ? ' mode-tab-on' : '')}
            onClick={() => { crowd.uiSelect(); onMode('compare') }}
          >
            COMPARE
          </button>
        </nav>
      )}

      {isCity && (
        <div className="hero">
          <p className="hero-kicker">CHURCHGATE · SOUTH MUMBAI</p>
          <h2 className="hero-title">Fortress Wankhede</h2>
          <p className="hero-sub">
            Wedged between the Arabian Sea, Marine Drive and the Western Railway —
            33,108 seats under a floating white crown.
          </p>
          <button
            className="enter-btn"
            onMouseEnter={() => crowd.uiHover()}
            onClick={() => { crowd.ensure(); crowd.uiSelect(); onGoStadium() }}
          >
            ENTER THE STADIUM
          </button>
        </div>
      )}

      {!isCity && !compareViewing && (
        <div className="left-nav">
          <p className="panel-title">Price ranges · pick one</p>
          {PRICE_TIERS.map((t, i) => (
            <button
              key={t.label}
              className={'range-row' + (priceFilter === i ? ' range-row-on' : '')}
              onMouseEnter={() => crowd.uiHover()}
              onClick={() => { crowd.uiSelect(); onPriceFilter(priceFilter === i ? null : i) }}
            >
              <span className="swatch" style={{ background: t.color }} />
              <span>{t.label}</span>
            </button>
          ))}
          {priceFilter != null && (
            <p className="range-note">Sections outside this range are dimmed — click one that pops.</p>
          )}
          <BudgetFinder onGoBlock={onGoBlock} onGoStand={onGoStand} />
        </div>
      )}

      {/* hints */}
      {!isCity && !compareViewing && explorer.level === 'stadium' && !hoveredSeat && !comparePicking && (
        <div className="hint">
          Drag to rotate · Scroll to zoom · <b>Click a seat</b> or pick a stand →
        </div>
      )}
      {explorer.level === 'stadium' && hoveredSeat && !comparePicking && (
        <div className="hover-chip">
          <b>{hoveredSeat.stand.name}</b>
          <span className="chip-sep">·</span> Block {hoveredSeat.block} · {hoveredSeat.tier.name}
          <span className="chip-price">{inr(hoveredSeat.tier.price)}</span>
        </div>
      )}
      {explorer.level === 'block' && hoveredSeat && (
        <div className="hover-chip">
          <b>Seat {seatCode(hoveredSeat)}</b>
          <span className="chip-sep">·</span> Row {String.fromCharCode(64 + Math.min(26, hoveredSeat.row))}
          <span className="chip-price">{inr(hoveredSeat.tier.price)}</span>
        </div>
      )}

      {/* compare: picking bar */}
      {comparePicking && (
        <div className="compare-bar">
          <p className="compare-title">Pick up to 3 blocks from the stands panel →</p>
          <div className="compare-chips">
            {compareSel.map((s, i) => (
              <span className="compare-chip" key={i}>
                {STAND_BY_ID[s.standId].short} · {s.block}
                <button className="chip-x" onClick={() => { crowd.uiSelect(); onRemoveCompareSel(i) }}>×</button>
              </span>
            ))}
            {compareSel.length === 0 && <span className="compare-empty">No blocks picked yet</span>}
          </div>
          <button
            className="compare-go"
            disabled={compareSel.length < 2}
            onClick={() => { crowd.uiSelect(); onStartCompare() }}
          >
            COMPARE VIEWS ({compareSel.length})
          </button>
        </div>
      )}

      {/* compare: viewing bar with arrows */}
      {compareViewing && compareSel[compareIdx] && (
        <CompareViewer
          sel={compareSel}
          idx={compareIdx}
          onIdx={onCompareIdx}
          onExit={() => { crowd.uiSelect(); onStopCompareView() }}
        />
      )}

      {!isCity && !compareViewing && (
        <ExplorerCard
          explorer={explorer}
          selectedSeat={selectedSeat}
          hoveredSeat={hoveredSeat}
          onGoStadium={onGoStadium}
          onGoStand={onGoStand}
          onGoBlock={onGoBlock}
          onHoverTarget={onHoverTarget}
          comparePicking={comparePicking}
          onAddCompare={onAddCompare}
        />
      )}

      {!isCity && !compareViewing && <PriceTracker stand={contextStand} />}

      <footer className="credit">Wankhede Stadium · 3D seat-view explorer</footer>
    </div>
  )
}

function CompareViewer({ sel, idx, onIdx, onExit }) {
  const s = sel[idx]
  const stand = STAND_BY_ID[s.standId]
  const seat = s.seat
  const step = d => {
    crowd.uiSelect()
    onIdx((idx + d + sel.length) % sel.length)
  }
  return (
    <div className="compare-viewer">
      <button className="cmp-arrow" onClick={() => step(-1)} title="Previous view">‹</button>
      <div className="cmp-body">
        <p className="cmp-count">{idx + 1} / {sel.length}</p>
        <p className="cmp-name">{stand.name} · Block {s.block}</p>
        <p className="cmp-meta">
          {seat.tier.name} · {inr(seat.tier.price)} · view score <b>{seat.facts.score}</b>
        </p>
        <div className="cmp-actions">
          <button
            className="snap-btn"
            onClick={() => shareSnapshot({ title: `${stand.name} · Block ${s.block} · Seat ${seatCode(seat)}`, price: inr(seat.tier.price) })}
          >
            <CameraIcon /> SNAPSHOT
          </button>
          <button className="cmp-exit" onClick={onExit}>EXIT COMPARE</button>
        </div>
      </div>
      <button className="cmp-arrow" onClick={() => step(1)} title="Next view">›</button>
    </div>
  )
}

function ExplorerCard({ explorer, selectedSeat, hoveredSeat, onGoStadium, onGoStand, onGoBlock, onHoverTarget, comparePicking, onAddCompare }) {
  if (explorer.level === 'stadium') {
    return (
      <div className="explorer">
        <p className="panel-title">Explore the stands</p>
        {STANDS.map(s => {
          const [lo, hi] = standPriceRange(s)
          const hovered = hoveredSeat && hoveredSeat.stand.id === s.id
          return (
            <button
              key={s.id}
              className={'stand-row' + (hovered ? ' stand-row-hot' : '')}
              onClick={() => { crowd.uiSelect(); onHoverTarget(null); onGoStand(s.id) }}
              onMouseEnter={() => { crowd.uiHover(); onHoverTarget({ standId: s.id }) }}
              onMouseLeave={() => onHoverTarget(null)}
            >
              <span className="stand-dot" style={{ background: priceColor(lo) }} />
              <span className="stand-row-name">
                {s.name}
                {s.premium && <span className="premium-chip">PREMIUM</span>}
              </span>
              <span className="stand-row-right">
                <StarRow n={s.value} />
                <span className="stand-row-price">{lo === hi ? inr(lo) : `${inr(lo)}–${inr(hi)}`}</span>
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  const stand = STAND_BY_ID[explorer.standId]
  if (!stand) return null

  if (explorer.level === 'stand') {
    return (
      <div className="explorer">
        <button className="back-link" onClick={() => { crowd.uiSelect(); onGoStadium() }}>← ALL STANDS</button>
        <p className="explorer-stand-name">
          {stand.name}
          {stand.premium && <span className="premium-chip">PREMIUM</span>}
        </p>
        <div className="stand-meta">
          <StarRow n={stand.value} />
          <span className="meta-label">view rating</span>
        </div>
        <p className="explorer-view">{stand.view}</p>
        <div className="tier-list">
          {stand.tiers.map((tier, ti) => (
            <div className="tier-group" key={ti}>
              <div className="tier-head">
                <span>{tier.name}</span>
                <span className="tier-price">{inr(tier.price)}</span>
              </div>
              <div className="block-grid">
                {(tier.blocks || stand.blocks).map(b => (
                  <button
                    key={b}
                    className="block-chip"
                    onClick={() => {
                      crowd.uiSelect()
                      onHoverTarget(null)
                      if (comparePicking) onAddCompare(stand.id, ti, b)
                      else onGoBlock(stand.id, ti, b)
                    }}
                    onMouseEnter={() => { crowd.uiHover(); onHoverTarget({ standId: stand.id, tierIdx: ti, block: b }) }}
                    onMouseLeave={() => onHoverTarget(null)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="explorer-tip">Pick a block — we’ll zoom in so you can choose your exact seat</p>
      </div>
    )
  }

  if (explorer.level === 'block') {
    const tier = stand.tiers[explorer.tierIdx]
    return (
      <div className="explorer">
        <button className="back-link" onClick={() => { crowd.uiSelect(); onGoStand(stand.id) }}>← {stand.name.toUpperCase()}</button>
        <p className="explorer-stand-name">Block {explorer.block}</p>
        <p className="seat-detail">{tier.name} · {inr(tier.price)}</p>
        <p className="explorer-view">
          <b>Click any seat</b> in the zoomed view to see the match from exactly there.
          Rows are lettered from the front — A is pitch-side.
        </p>
        {tier.profile.baseY < 5 && (
          <p className="net-warning">Rows A–D sit behind the boundary mesh; row E upward clears it.</p>
        )}
        <p className="explorer-tip">Drag to look around the block · Scroll to zoom</p>
      </div>
    )
  }

  // seat POV
  const seat = selectedSeat
  if (!seat) return null
  return (
    <div className="explorer">
      <button
        className="back-link"
        onClick={() => { crowd.uiSelect(); onGoBlock(stand.id, explorer.tierIdx, explorer.block) }}
      >
        ← BLOCK {explorer.block}
      </button>
      <p className="explorer-stand-name">Seat {seatCode(seat)}</p>
      <p className="seat-detail">
        {seat.tier.name} · Block {seat.block} · Row {String.fromCharCode(64 + Math.min(26, seat.row))}
      </p>
      <div className="seat-price-row">
        <span className="seat-price">{inr(seat.tier.price)}</span>
        <StarRow n={seat.stand.value} />
      </div>
      {seat.facts && (
        <>
          <div className="facts-grid">
            <div className="fact">
              <span className="fact-num">{seat.facts.distance} m</span>
              <span className="fact-label">to pitch</span>
            </div>
            <div className="fact">
              <span className="fact-num">{seat.facts.height} m</span>
              <span className="fact-label">above ground</span>
            </div>
            <div className="fact">
              <span className="fact-num">{seat.facts.score}</span>
              <span className="fact-label">view score</span>
            </div>
          </div>
          {seat.facts.netObstructed && (
            <p className="net-warning">Front-row catch: your sightline passes through the boundary netting</p>
          )}
          <p className="view-angle">{seat.facts.angleDesc}</p>
          <p className="view-relatable">{seat.facts.relatable}</p>
        </>
      )}
      <button
        className="snap-btn snap-wide"
        onClick={() => shareSnapshot({ title: `${stand.name} · Block ${seat.block} · Seat ${seatCode(seat)}`, price: inr(seat.tier.price) })}
      >
        <CameraIcon /> SNAPSHOT & SHARE
      </button>
      <p className="explorer-tip">Drag to look around · Click another seat to move</p>
      <button className="exit-btn" onClick={() => { crowd.uiSelect(); onGoStadium() }}>STADIUM VIEW</button>
    </div>
  )
}

const BUDGET_BILLS = [
  { label: '₹2,000', max: 2000 },
  { label: '₹5,000', max: 5000 },
  { label: '₹10,000', max: 10000 },
  { label: '₹15,000+', max: Infinity },
]

function BudgetFinder({ onGoBlock, onGoStand }) {
  const [budget, setBudget] = React.useState(null) // index into BUDGET_BILLS

  const picks = useMemo(() => {
    if (budget == null) return []
    const max = BUDGET_BILLS[budget].max
    const out = []
    STANDS.forEach(s => {
      s.tiers.forEach((t, ti) => {
        if (t.price > max) return
        const blocks = t.blocks || s.blocks
        let best = null
        blocks.forEach(b => {
          const seat = findBlockSeat(s.id, ti, b)
          if (!seat) return
          const facts = computeViewFacts(seat)
          if (!best || facts.score > best.score) best = { block: b, score: facts.score }
        })
        if (best) out.push({ standId: s.id, name: s.short, tierIdx: ti, tierName: t.name, price: t.price, ...best })
      })
    })
    return out.sort((a, b) => b.score - a.score || a.price - b.price).slice(0, 3)
  }, [budget])

  return (
    <div className="budget">
      <p className="panel-title">Best seat for my budget</p>
      <div className="bill-row">
        {BUDGET_BILLS.map((b, i) => (
          <button
            key={b.label}
            className={'bill' + (budget === i ? ' bill-on' : '')}
            onClick={() => { crowd.uiSelect(); setBudget(budget === i ? null : i) }}
          >
            {b.label}
          </button>
        ))}
      </div>
      {budget != null && picks.length > 0 && (
        <div className="picks">
          {picks.map((p, i) => (
            <button
              key={i}
              className="pick-row"
              onMouseEnter={() => crowd.uiHover()}
              onClick={() => { crowd.uiSelect(); onGoStand(p.standId); setTimeout(() => onGoBlock(p.standId, p.tierIdx, p.block), 50) }}
            >
              <span className="pick-rank">{i + 1}</span>
              <span className="pick-name">{p.name} · {p.tierName.split('·')[0].trim()} · Block {p.block}</span>
              <span className="pick-right">{inr(p.price)} · <b>{p.score}</b></span>
            </button>
          ))}
        </div>
      )}
      {budget != null && picks.length === 0 && (
        <p className="range-note">Nothing under this budget.</p>
      )}
      <p className="proto-note">Prototype — a live version would rank by real-time availability.</p>
    </div>
  )
}

function PriceTracker({ stand }) {
  if (!stand) {
    return (
      <div className="tracker">
        <p className="panel-title">Ticket pulse</p>
        <p className="tracker-line">Cheapest seat <b>{inr(1500)}</b> · Sunil Gavaskar L1</p>
        <p className="tracker-line">Priciest box <b>{inr(35000)}</b> · MCA Pavilion</p>
        <p className="tracker-note">MI home games sell out in 15–20 minutes on BookMyShow</p>
      </div>
    )
  }
  const years = Object.keys(stand.priceHistory)
  const max = Math.max(...Object.values(stand.priceHistory))
  return (
    <div className="tracker">
      <p className="panel-title">{stand.short} · price history</p>
      <div className="history-row">
        {years.map(y => {
          const v = stand.priceHistory[y]
          return (
            <div className="history-col" key={y}>
              <span className="history-val">{v >= 1000 ? '₹' + (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : inr(v)}</span>
              <div className="history-bar-track">
                <div className="history-bar" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
              </div>
              <span className="history-year">{y}</span>
            </div>
          )
        })}
      </div>
      <div className="demand-row">
        <span className="meta-label">Demand</span>
        <DemandMeter n={stand.demand} />
      </div>
      <p className="tracker-note">{stand.selloutNote}</p>
    </div>
  )
}
