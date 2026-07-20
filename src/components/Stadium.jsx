import React, { useMemo, useRef, useLayoutEffect, useCallback } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { STANDS, FIELD_RX, FIELD_RZ, STAND_GAP, priceColor, SKIN_TONES, MI_BLUE, MI_GOLD, PRICE_TIERS } from '../data/stadium.js'

// price range covered by PRICE_TIERS[idx]
export function tierRange(idx) {
  const min = idx === 0 ? 0 : PRICE_TIERS[idx - 1].max
  return [min, PRICE_TIERS[idx].max]
}

const MUTE_GRAY = new THREE.Color('#9298a6')

const DEG = Math.PI / 180
// point on the (offset) stadium ellipse at angle a (deg, 0=N, clockwise), radial offset o
function ringPoint(aDeg, o, y = 0) {
  const a = aDeg * DEG
  return new THREE.Vector3(
    Math.sin(a) * (FIELD_RX + STAND_GAP + o),
    y,
    -Math.cos(a) * (FIELD_RZ + STAND_GAP + o)
  )
}

// Arc strip between two edge profiles: (o0,y0) inner edge → (o1,y1) outer edge
// UVs: u accumulates real arc metres / 26 (one texture repeat ≈ 26 m), v across.
function arcStripGeometry(a0, a1, o0, y0, o1, y1, segments = 24) {
  const pos = []
  const uv = []
  let dist = 0
  let prev = ringPoint(a0, o0, y0)
  for (let i = 0; i < segments; i++) {
    const t0 = a0 + ((a1 - a0) * i) / segments
    const t1 = a0 + ((a1 - a0) * (i + 1)) / segments
    const p00 = ringPoint(t0, o0, y0), p01 = ringPoint(t1, o0, y0)
    const p10 = ringPoint(t0, o1, y1), p11 = ringPoint(t1, o1, y1)
    const u0 = dist / 26
    dist += p01.distanceTo(prev)
    prev = p01
    const u1 = dist / 26
    pos.push(p00, p10, p11, p00, p11, p01)
    uv.push(u0, 0, u0, 1, u1, 1, u0, 0, u1, 1, u1, 0)
  }
  const g = new THREE.BufferGeometry()
  const arr = new Float32Array(pos.length * 3)
  pos.forEach((p, i) => { arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z })
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2))
  g.computeVertexNormals()
  return g
}

// LED fascia ribbon texture — MI blue with the match-day slogans
const fasciaTexture = (() => {
  const c = document.createElement('canvas')
  c.width = 1536
  c.height = 96
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, 96)
  grad.addColorStop(0, '#1156d6')
  grad.addColorStop(1, '#004ba0')
  g.fillStyle = grad
  g.fillRect(0, 0, 1536, 96)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = '#ffffff'
  g.font = 'bold 46px "Rajdhani", "Arial Narrow", sans-serif'
  g.fillText('MUMBAI INDIANS', 280, 50)
  g.fillStyle = '#ffd93d'
  g.fillText('AALA RE', 640, 50)
  g.fillStyle = '#ffffff'
  g.fillText('DUNIYA HILA DENGE HUM', 1020, 50)
  g.fillStyle = '#ffd93d'
  g.font = 'bold 40px "Rajdhani", "Arial Narrow", sans-serif'
  g.fillText('★', 1370, 50)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.anisotropy = 4
  return tex
})()

// merged seat + backrest geometry, origin at seat base centre, facing -Z locally
const seatGeometry = (() => {
  const seat = new THREE.BoxGeometry(0.42, 0.1, 0.4)
  seat.translate(0, 0.24, 0)
  const back = new THREE.BoxGeometry(0.42, 0.38, 0.07)
  back.translate(0, 0.42, 0.2)
  return mergeGeometries([seat, back])
})()

// bobblehead spectator: low-poly torso (shirt colour) + head (skin tone)
const torsoGeometry = (() => {
  const g = new THREE.CylinderGeometry(0.16, 0.19, 0.52, 6)
  g.translate(0, 0.56, 0.02)
  return g
})()
const headGeometry = (() => {
  const g = new THREE.SphereGeometry(0.115, 7, 6)
  g.translate(0, 0.95, 0.02)
  return g
})()

// deterministic per-seat pseudo-random so the crowd is stable across renders
const srand = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function buildSeats() {
  // Precompute every seat instance grouped per stand+tier
  const groups = []
  for (const stand of STANDS) {
    stand.tiers.forEach((tier, tierIdx) => {
      const seats = []
      const blocks = tier.blocks || stand.blocks
      const ta0 = tier.a0 ?? stand.a0
      const ta1 = tier.a1 ?? stand.a1
      const nBlocks = blocks.length
      const gap = 1.3 // deg aisle between blocks
      const span = ta1 - ta0
      const blockSpan = (span - gap * (nBlocks - 1)) / nBlocks
      blocks.forEach((blockName, bi) => {
        const b0 = ta0 + bi * (blockSpan + gap)
        const b1 = b0 + blockSpan
        for (let row = 0; row < tier.rows; row++) {
          const o = tier.profile.baseR + row * tier.profile.rowDepth
          const y = tier.profile.baseY + row * tier.profile.rowRise
          const aMid = ((b0 + b1) / 2) * DEG
          const r = Math.hypot(
            Math.sin(aMid) * (FIELD_RX + STAND_GAP + o),
            Math.cos(aMid) * (FIELD_RZ + STAND_GAP + o)
          )
          const seatArc = (0.55 / r) / DEG // deg per seat
          const count = Math.max(1, Math.floor((b1 - b0) / seatArc))
          for (let s = 0; s < count; s++) {
            const a = b0 + seatArc * (s + 0.5)
            const p = ringPoint(a, o, y)
            seats.push({
              angle: a, position: p,
              yaw: Math.atan2(-p.x, -p.z) + Math.PI,
              standId: stand.id, tierIdx, block: blockName, blockIdx: bi,
              row: row + 1, seatNo: s + 1,
            })
          }
        }
      })
      groups.push({ stand, tier, tierIdx, seats })
    })
  }
  return groups
}

function SeatBlock({ group, onSelectSeat, onHover, selectedSeat, highlight, priceFilter, clickScope }) {
  const ref = useRef()
  const torsoRef = useRef()
  const headRef = useRef()
  const { stand, tier, seats } = group
  const baseColor = useMemo(() => new THREE.Color(priceColor(tier.price)), [tier.price])
  const hovered = useRef(-1)
  const hiddenIdx = useRef(-1)

  // price-range filter: does this tier's price fall inside the picked range?
  const inRange = useMemo(() => {
    if (priceFilter == null) return true
    const [min, max] = tierRange(priceFilter)
    return tier.price > min && tier.price <= max
  }, [priceFilter, tier.price])
  const filterActive = priceFilter != null

  // deterministic crowd shirt colour — ~80% MI blue (it's an MI home game),
  // a small pocket of RCB red away fans, the rest neutral
  const torsoColorFor = useCallback((i, c) => {
    const r3 = srand(i + 15555)
    if (r3 < 0.5) c.set(MI_BLUE).offsetHSL((srand(i + 31) - 0.5) * 0.05, 0, (srand(i + 61) - 0.5) * 0.22)
    else if (r3 < 0.65) c.set('#1c5bd9').offsetHSL(0, 0, (srand(i + 71) - 0.5) * 0.15)
    else if (r3 < 0.8) c.set('#0e3f8e').offsetHSL(0, 0, (srand(i + 81) - 0.5) * 0.15)
    else if (r3 < 0.88) c.set('#f4f6fb')
    else if (r3 < 0.93) c.set('#c62828')
    else c.copy(baseColor).offsetHSL((srand(i + 91) - 0.5) * 0.08, 0, (srand(i + 121) - 0.5) * 0.15)
    return c
  }, [baseColor])

  const composePerson = useCallback((i, m) => {
    const q = new THREE.Quaternion()
    const seat = seats[i]
    const r1 = srand(i), r2 = srand(i + 7777)
    const s = 0.88 + r1 * 0.22
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), seat.yaw + (r2 - 0.5) * 0.35)
    m.compose(seat.position, q, new THREE.Vector3(s, s, s))
    return m
  }, [seats])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    const scale = new THREE.Vector3(1, 1, 1)
    const c = new THREE.Color()
    seats.forEach((seat, i) => {
      q.setFromAxisAngle(up, seat.yaw)
      m.compose(seat.position, q, scale)
      ref.current.setMatrixAt(i, m)
      // alternate block shading so blocks read as distinct
      c.copy(baseColor).multiplyScalar(seat.blockIdx % 2 === 0 ? 1.0 : 0.8)
      ref.current.setColorAt(i, c)

      // ── the crowd: a fan in every seat, sea-of-blue with pastel sections
      composePerson(i, m)
      torsoRef.current.setMatrixAt(i, m)
      headRef.current.setMatrixAt(i, m)
      torsoRef.current.setColorAt(i, torsoColorFor(i, c))
      headRef.current.setColorAt(i, c.set(SKIN_TONES[Math.floor(srand(i + 151) * SKIN_TONES.length)]))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
    torsoRef.current.instanceMatrix.needsUpdate = true
    headRef.current.instanceMatrix.needsUpdate = true
    if (torsoRef.current.instanceColor) torsoRef.current.instanceColor.needsUpdate = true
    if (headRef.current.instanceColor) headRef.current.instanceColor.needsUpdate = true
    torsoRef.current.computeBoundingSphere()
    headRef.current.computeBoundingSphere()
  }, [seats, baseColor, composePerson, torsoColorFor])

  // explorer hover glow + price-range filter (detective-vision style: sections
  // outside the range fade to gray; matching sections keep their colour)
  const highlightActive =
    highlight && highlight.standId === stand.id &&
    (highlight.tierIdx == null || highlight.tierIdx === group.tierIdx)
  const highlightBlock = highlight ? highlight.block : null
  useLayoutEffect(() => {
    if (!ref.current) return
    const c = new THREE.Color()
    const white = new THREE.Color('#ffffff')
    const mutedSeats = filterActive && !inRange
    seats.forEach((seat, i) => {
      c.copy(baseColor).multiplyScalar(seat.blockIdx % 2 === 0 ? 1.0 : 0.8)
      if (mutedSeats) c.lerp(MUTE_GRAY, 0.82)
      else if (filterActive) c.lerp(white, 0.12)
      if (highlightActive && (highlightBlock == null || seat.block === highlightBlock)) {
        c.lerp(white, 0.65)
      }
      ref.current.setColorAt(i, c)
    })
    ref.current.instanceColor.needsUpdate = true

    // crowd fades with its section
    if (torsoRef.current && headRef.current) {
      const skin = new THREE.Color()
      seats.forEach((_, i) => {
        torsoColorFor(i, c)
        skin.set(SKIN_TONES[Math.floor(srand(i + 151) * SKIN_TONES.length)])
        if (mutedSeats) {
          c.lerp(MUTE_GRAY, 0.8)
          skin.lerp(MUTE_GRAY, 0.8)
        }
        torsoRef.current.setColorAt(i, c)
        headRef.current.setColorAt(i, skin)
      })
      torsoRef.current.instanceColor.needsUpdate = true
      headRef.current.instanceColor.needsUpdate = true
    }
  }, [highlightActive, highlightBlock, seats, baseColor, filterActive, inRange, torsoColorFor])

  // your own seat stays empty while you're sitting in it
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    if (hiddenIdx.current >= 0) {
      composePerson(hiddenIdx.current, m)
      torsoRef.current.setMatrixAt(hiddenIdx.current, m)
      headRef.current.setMatrixAt(hiddenIdx.current, m)
      hiddenIdx.current = -1
    }
    if (
      selectedSeat &&
      selectedSeat.standId === stand.id &&
      selectedSeat.tierIdx === group.tierIdx
    ) {
      const i = seats.findIndex(
        s => s.block === selectedSeat.block && s.row === selectedSeat.seat.row && s.seatNo === selectedSeat.seat.seatNo
      )
      if (i >= 0) {
        m.makeScale(0, 0, 0)
        torsoRef.current.setMatrixAt(i, m)
        headRef.current.setMatrixAt(i, m)
        hiddenIdx.current = i
      }
    }
    torsoRef.current.instanceMatrix.needsUpdate = true
    headRef.current.instanceMatrix.needsUpdate = true
  }, [selectedSeat, seats, stand.id, group.tierIdx, composePerson])

  const restore = useCallback(i => {
    if (i < 0 || !ref.current) return
    const c = new THREE.Color().copy(baseColor).multiplyScalar(seats[i].blockIdx % 2 === 0 ? 1.0 : 0.8)
    ref.current.setColorAt(i, c)
    ref.current.instanceColor.needsUpdate = true
  }, [seats, baseColor])

  return (
    <group>
      <instancedMesh args={[torsoGeometry, undefined, seats.length]} ref={torsoRef}>
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh args={[headGeometry, undefined, seats.length]} ref={headRef}>
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh
        ref={ref}
        args={[seatGeometry, undefined, seats.length]}
        onClick={e => {
          if (e.delta > 4) return
          e.stopPropagation()
          const seat = seats[e.instanceId]
          // once a block is focused, only ITS seats are selectable
          if (clickScope && (stand.id !== clickScope.standId || group.tierIdx !== clickScope.tierIdx || seat.block !== clickScope.block)) return
          onSelectSeat({ ...seat, stand, tier })
        }}
        onPointerMove={e => {
          e.stopPropagation()
          const id = e.instanceId
          const seat = seats[id]
          if (clickScope && (stand.id !== clickScope.standId || group.tierIdx !== clickScope.tierIdx || seat.block !== clickScope.block)) {
            restore(hovered.current)
            hovered.current = -1
            onHover(null)
            document.body.style.cursor = 'auto'
            return
          }
          if (id === hovered.current) return
          restore(hovered.current)
          hovered.current = id
          ref.current.setColorAt(id, new THREE.Color('#ffffff'))
          ref.current.instanceColor.needsUpdate = true
          onHover({ ...seat, stand, tier })
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          restore(hovered.current)
          hovered.current = -1
          onHover(null)
          document.body.style.cursor = 'auto'
        }}
      >
        <meshLambertMaterial />
      </instancedMesh>
    </group>
  )
}

function StandStructure({ stand }) {
  const { concrete, fascias } = useMemo(() => {
    const concrete = []
    const fascias = []
    for (const tier of stand.tiers) {
      const p = tier.profile
      const a0 = tier.a0 ?? stand.a0
      const a1 = tier.a1 ?? stand.a1
      const depth = tier.rows * p.rowDepth
      const rise = tier.rows * p.rowRise
      // sloped rake under the seats
      concrete.push(arcStripGeometry(a0, a1, p.baseR, p.baseY - 0.35, p.baseR + depth, p.baseY + rise - 0.35))
      // lower part of the front wall (concrete)
      concrete.push(arcStripGeometry(a0, a1, p.baseR, p.baseY - 1.6, p.baseR, Math.max(0.5, p.baseY - 3.2)))
      // LED fascia ribbon along the top of the front wall — MI blue slogans
      // (bottom edge first so the texture's v axis maps upright)
      fascias.push(arcStripGeometry(a0, a1, p.baseR, p.baseY - 1.6, p.baseR, p.baseY - 0.35))
      // back wall up to next level
      concrete.push(arcStripGeometry(a0, a1, p.baseR + depth, p.baseY + rise - 0.35, p.baseR + depth + 0.4, p.baseY + rise + 1.1))
    }
    return { concrete, fascias }
  }, [stand])
  return (
    <group>
      {concrete.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshLambertMaterial color="#9aa1b0" side={THREE.DoubleSide} />
        </mesh>
      ))}
      {fascias.map((g, i) => (
        <mesh key={'f' + i} geometry={g}>
          <meshBasicMaterial map={fasciaTexture} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

// Module-level cache so the UI can look up seats without rebuilding geometry.
let seatGroupsCache = null
export function getSeatGroups() {
  if (!seatGroupsCache) seatGroupsCache = buildSeats()
  return seatGroupsCache
}

// Representative seat for a block: middle of the block, ~55% of the way back.
export function findBlockSeat(standId, tierIdx, block) {
  const group = getSeatGroups().find(g => g.stand.id === standId && g.tierIdx === tierIdx)
  if (!group) return null
  const inBlock = group.seats.filter(s => s.block === block)
  if (!inBlock.length) return null
  const targetRow = Math.max(1, Math.round(group.tier.rows * 0.55))
  const rowSeats = inBlock.filter(s => s.row === targetRow)
  const pick = rowSeats.length ? rowSeats : inBlock
  return { ...pick[Math.floor(pick.length / 2)], stand: group.stand, tier: group.tier }
}

// row letters as printed on Wankhede tickets: row 1 = A (front), seat code "I51"
export function seatCode(seat) {
  return String.fromCharCode(64 + Math.min(26, seat.row)) + seat.seatNo
}

// Arc footprint of a section, for a beacon that rises across the whole stand.
// Returns { a0, a1, offset, baseY } in the seating coordinate space:
//  - a0/a1  angular span (full stand, or one block's sub-range)
//  - offset radial offset at the BACK/top of the seating
//  - baseY  height at the top of the seating (where the curtain starts)
// Accepts a stand, stand+tier, or stand+tier+block (most specific wins).
export function sectionArc({ standId, tierIdx, block }) {
  const stand = STANDS.find(s => s.id === standId)
  if (!stand) return null

  // pick the tier that defines the top: the specified one, else the tallest
  let tier, ti
  if (tierIdx != null) { tier = stand.tiers[tierIdx]; ti = tierIdx }
  else {
    stand.tiers.forEach((t, i) => {
      const top = t.profile.baseY + t.rows * t.profile.rowRise
      if (!tier || top > tier.profile.baseY + tier.rows * tier.profile.rowRise) { tier = t; ti = i }
    })
  }
  const p = tier.profile
  const offset = p.baseR + tier.rows * p.rowDepth
  const baseY = p.baseY + tier.rows * p.rowRise

  let a0 = tier.a0 ?? stand.a0
  let a1 = tier.a1 ?? stand.a1
  if (block != null) {
    const blocks = tier.blocks || stand.blocks
    const bi = Math.max(0, blocks.indexOf(block))
    const gap = 1.3
    const span = (a1 - a0 - gap * (blocks.length - 1)) / blocks.length
    const b0 = a0 + bi * (span + gap)
    a0 = b0
    a1 = b0 + span
  }
  return { a0, a1, offset, baseY }
}

export default function Stadium({ onSelectSeat, onHover, selection, highlight, priceFilter, clickScope }) {
  const groups = useMemo(() => getSeatGroups(), [])
  return (
    <group>
      {groups.map((g, i) => (
        <SeatBlock
          key={i}
          group={g}
          onSelectSeat={onSelectSeat}
          onHover={onHover}
          selectedSeat={selection}
          highlight={highlight}
          priceFilter={priceFilter}
          clickScope={clickScope}
        />
      ))}
      {STANDS.map(s => <StandStructure key={s.id} stand={s} />)}
    </group>
  )
}
