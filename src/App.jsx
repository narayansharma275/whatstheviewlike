import React, { useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import Field from './components/Field.jsx'
import Players from './components/Players.jsx'
import Stadium, { findBlockSeat, sectionArc } from './components/Stadium.jsx'
import Beacon from './components/Beacon.jsx'
import Roof from './components/Roof.jsx'
import Floodlights from './components/Floodlights.jsx'
import Netting from './components/Netting.jsx'
import Scoreboard from './components/Scoreboard.jsx'
import Exterior from './components/Exterior.jsx'
import CityScape from './components/CityScape.jsx'
import CameraRig from './components/CameraRig.jsx'
import Overlay from './ui/Overlay.jsx'
import crowd from './audio/crowd.js'
import { computeViewFacts, STAND_BY_ID, priceColor } from './data/stadium.js'
import './ui/overlay.css'

// explorer levels: 'city' → 'stadium' → 'stand' → 'block' (camera zooms into
// the block so you pick your exact seat) → 'seat' (that seat's POV)
export default function App() {
  const [explorer, setExplorer] = useState({ level: 'city' })
  const [hoveredSeat, setHoveredSeat] = useState(null)
  const [hoverTarget, setHoverTarget] = useState(null)
  const [muted, setMuted] = useState(false)
  const [priceFilter, setPriceFilter] = useState(null) // index into PRICE_TIERS or null
  const [mode, setMode] = useState('explore')          // 'explore' | 'compare'
  const [compareSel, setCompareSel] = useState([])     // [{standId, tierIdx, block, seat}]
  const [compareIdx, setCompareIdx] = useState(null)   // null = picking, number = viewing

  const selectedSeat =
    mode === 'compare' && compareIdx != null ? compareSel[compareIdx]?.seat
    : explorer.level === 'seat' ? explorer.seat
    : null

  const focus = useMemo(() => {
    if (mode === 'compare' && compareIdx != null && compareSel[compareIdx]) {
      const s = compareSel[compareIdx]
      return { key: `cmp:${compareIdx}:${s.standId}:${s.tierIdx}:${s.block}`, type: 'seat', seat: s.seat }
    }
    if (explorer.level === 'seat') {
      return { key: `seat:${explorer.standId}:${explorer.tierIdx}:${explorer.block}:${explorer.seat.row}:${explorer.seat.seatNo}`, type: 'seat', seat: explorer.seat }
    }
    if (explorer.level === 'block') {
      return {
        key: `block:${explorer.standId}:${explorer.tierIdx}:${explorer.block}`,
        type: 'block',
        stand: STAND_BY_ID[explorer.standId],
        tierIdx: explorer.tierIdx,
        block: explorer.block,
      }
    }
    if (explorer.level === 'stand') {
      return { key: `stand:${explorer.standId}`, type: 'stand', stand: STAND_BY_ID[explorer.standId] }
    }
    if (explorer.level === 'city') {
      return { key: 'city', type: 'city' }
    }
    return { key: 'overview', type: 'overview' }
  }, [explorer, mode, compareSel, compareIdx])

  const goStadium = useCallback(() => {
    setExplorer({ level: 'stadium' })
    crowd.setScene('overview')
  }, [])

  const goStand = useCallback(standId => {
    setExplorer({ level: 'stand', standId })
    crowd.ensure()
    crowd.setScene('overview')
  }, [])

  // block click zooms INTO the block; the user then clicks their exact seat
  const goBlock = useCallback((standId, tierIdx, block) => {
    setExplorer({ level: 'block', standId, tierIdx, block })
    crowd.ensure()
    crowd.setScene('overview')
  }, [])

  // compare selections come from the explorer panel (blocks are too small to
  // click reliably in the 3D bowl)
  const addCompareBlock = useCallback((standId, tierIdx, block) => {
    setCompareSel(prev => {
      if (prev.length >= 3) return prev
      if (prev.some(s => s.standId === standId && s.tierIdx === tierIdx && s.block === block)) return prev
      const centroid = findBlockSeat(standId, tierIdx, block)
      if (!centroid) return prev
      crowd.uiSelect()
      return [...prev, {
        standId, tierIdx, block,
        seat: { ...centroid, facts: computeViewFacts(centroid) },
      }]
    })
  }, [])

  // clicking a seat: explore mode → jump to it; compare picking → inert
  const handleSeatClick = useCallback(seat => {
    crowd.ensure()
    if (mode === 'compare' && compareIdx == null) return
    const withFacts = { ...seat, facts: computeViewFacts(seat) }
    setExplorer({
      level: 'seat',
      standId: seat.stand.id,
      tierIdx: seat.tierIdx,
      block: seat.block,
      seat: withFacts,
    })
    crowd.setScene('seat')
  }, [mode, compareIdx])

  const handleHover = useCallback(seat => setHoveredSeat(seat), [])

  const setModeSafe = useCallback(m => {
    setMode(m)
    setCompareSel([])
    setCompareIdx(null)
    if (m === 'compare') setExplorer(e => (e.level === 'city' ? e : { level: 'stadium' }))
    crowd.setScene('overview')
  }, [])

  const startCompare = useCallback(() => {
    setCompareIdx(0)
    crowd.setScene('seat')
  }, [])

  const stopCompareView = useCallback(() => {
    setCompareIdx(null)
    crowd.setScene('overview')
  }, [])

  const removeCompareSel = useCallback(i => {
    setCompareSel(prev => prev.filter((_, k) => k !== i))
  }, [])

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m
      crowd.ensure()
      crowd.setMuted(next)
      return next
    })
  }, [])

  const compareSelection = mode === 'compare' && compareIdx != null ? compareSel[compareIdx] : null
  const stadiumSelection =
    compareSelection || (explorer.level === 'seat' && mode === 'explore' ? explorer : null)

  // light-column beacons: mark compare picks (so all 3 stay findable in the
  // bowl) or the stand/block hovered in the side panel
  const beams = useMemo(() => {
    const priceAt = (standId, tierIdx, block) => {
      const s = STAND_BY_ID[standId]
      if (!s) return '#ffd93d'
      if (tierIdx != null) return priceColor(s.tiers[tierIdx].price)
      return priceColor(Math.min(...s.tiers.map(t => t.price)))
    }
    if (mode === 'compare' && compareIdx == null && compareSel.length) {
      return compareSel
        .map((s, i) => {
          const arc = sectionArc({ standId: s.standId, tierIdx: s.tierIdx, block: s.block })
          return arc && { key: `cmp${i}`, arc, color: priceAt(s.standId, s.tierIdx, s.block) }
        })
        .filter(Boolean)
    }
    if (mode === 'explore' && hoverTarget && (explorer.level === 'stadium' || explorer.level === 'stand')) {
      const arc = sectionArc(hoverTarget)
      if (arc) return [{ key: 'hover', arc, color: priceAt(hoverTarget.standId, hoverTarget.tierIdx, hoverTarget.block) }]
    }
    return []
  }, [mode, compareIdx, compareSel, hoverTarget, explorer.level])

  return (
    <>
      <Canvas
        camera={{ position: [430, 175, 260], fov: 52, near: 0.1, far: 2600 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.12
        }}
      >
        <color attach="background" args={['#8a7290']} />
        <fog attach="fog" args={['#d99a76', 800, 2200]} />

        {/* late-evening golden hour: low warm sun from over the Arabian Sea
            (west), floodlights just switched on */}
        <hemisphereLight args={['#ffd9b6', '#6a5f55', 0.7]} />
        <ambientLight intensity={0.32} color="#cbb9d6" />
        <directionalLight position={[-500, 100, 60]} intensity={1.55} color="#ffb070" />
        <directionalLight position={[300, 200, -150]} intensity={0.3} color="#c9d8ff" />

        <Field />
        <Players />
        <Stadium
          onSelectSeat={handleSeatClick}
          onHover={handleHover}
          selection={stadiumSelection}
          highlight={hoverTarget}
          priceFilter={priceFilter}
          clickScope={
            mode === 'explore' && (explorer.level === 'block' || explorer.level === 'seat')
              ? { standId: explorer.standId, tierIdx: explorer.tierIdx, block: explorer.block }
              : null
          }
          rowMarkerScope={
            mode === 'explore' && explorer.level === 'block'
              ? { standId: explorer.standId, tierIdx: explorer.tierIdx, block: explorer.block }
              : null
          }
        />
        <Roof />
        <Floodlights />
        <Netting />
        <Scoreboard />
        <Exterior />
        <CityScape />
        <Beacon beams={beams} />

        {/* ground plane outside the stadium — warm dusk asphalt */}
        <mesh rotation-x={-Math.PI / 2} position-y={-0.2}>
          <circleGeometry args={[1400, 48]} />
          <meshLambertMaterial color="#4a4152" />
        </mesh>

        <CameraRig focus={focus} />
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.82} intensity={0.5} mipmapBlur radius={0.7} />
        </EffectComposer>
      </Canvas>

      <Overlay
        explorer={explorer}
        selectedSeat={selectedSeat}
        hoveredSeat={hoveredSeat}
        onGoStadium={goStadium}
        onGoStand={goStand}
        onGoBlock={goBlock}
        onHoverTarget={setHoverTarget}
        muted={muted}
        onToggleMute={toggleMute}
        priceFilter={priceFilter}
        onPriceFilter={setPriceFilter}
        mode={mode}
        onMode={setModeSafe}
        compareSel={compareSel}
        compareIdx={compareIdx}
        onAddCompare={addCompareBlock}
        onStartCompare={startCompare}
        onStopCompareView={stopCompareView}
        onCompareIdx={setCompareIdx}
        onRemoveCompareSel={removeCompareSel}
      />
    </>
  )
}
