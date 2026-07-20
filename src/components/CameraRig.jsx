import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { FIELD_RX, FIELD_RZ, STAND_GAP } from '../data/stadium.js'

const ORBIT_POS = new THREE.Vector3(120, 105, 170)
const ORBIT_TARGET = new THREE.Vector3(0, 6, 0)
const EYE_HEIGHT = 1.1
const DEG = Math.PI / 180

function ringP(aDeg, o, y) {
  const a = aDeg * DEG
  return new THREE.Vector3(
    Math.sin(a) * (FIELD_RX + STAND_GAP + o),
    y,
    -Math.cos(a) * (FIELD_RZ + STAND_GAP + o)
  )
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
const smoothstep = (t, lo, hi) => {
  const x = THREE.MathUtils.clamp((t - lo) / (hi - lo), 0, 1)
  return x * x * (3 - 2 * x)
}

// Seat eye: a seated person's perspective — leaning slightly forward over the
// row in front, so the roof overhead stays out of frame on the top rows.
export function eyeFor(seat) {
  const p = seat.position.clone()
  const inward = new THREE.Vector3(-p.x, 0, -p.z).normalize()
  return p.addScaledVector(inward, 0.35).add(new THREE.Vector3(0, EYE_HEIGHT, 0))
}
// Damped look target: every seat looks across the pitch toward the far centre.
export function lookFor(seat) {
  return new THREE.Vector3(seat.position.x * 0.06, 1.2, seat.position.z * 0.06)
}

// focus: { key, type: 'overview' | 'stand' | 'seat', stand?, seat? }
// Flights follow a lifted CatmullRom arc; controls re-enable on arrival.
// IMPORTANT (seat mode): the controls target is a pivot ~2.5 m in front of the
// eyes — never the pitch — otherwise maxDistance clamping yanks the camera off
// the seat and dumps it at the pitch.
export default function CameraRig({ focus = { key: 'overview', type: 'overview' } }) {
  const controls = useRef()
  const camera = useThree(s => s.camera)
  const anim = useRef(null)
  const first = useRef(true)
  const idleTimer = useRef(null)
  const autoRotate = useRef(true)

  useEffect(() => {
    const type = focus.type
    let toPos, toTgt
    if (type === 'seat' && focus.seat) {
      toPos = eyeFor(focus.seat)
      const dir = lookFor(focus.seat).sub(toPos).normalize()
      toTgt = toPos.clone().addScaledVector(dir, 2.5) // near pivot, NOT the pitch
    } else if (type === 'stand' && focus.stand) {
      const s = focus.stand
      const mid = (s.a0 + s.a1) / 2
      toPos = ringP(mid, -58, 38)      // inside the field, high, facing the stand
      toTgt = ringP(mid, 14, 11)       // the stand itself
    } else if (type === 'block' && focus.stand) {
      // zoom right into one block so individual rows/seats are pickable
      const s = focus.stand
      const tier = s.tiers[focus.tierIdx]
      const blocks = tier.blocks || s.blocks
      const bi = Math.max(0, blocks.indexOf(focus.block))
      const ta0 = tier.a0 ?? s.a0
      const ta1 = tier.a1 ?? s.a1
      const gap = 1.3
      const blockSpan = (ta1 - ta0 - gap * (blocks.length - 1)) / blocks.length
      const bMid = ta0 + bi * (blockSpan + gap) + blockSpan / 2
      const p = tier.profile
      const midO = p.baseR + (tier.rows / 2) * p.rowDepth
      const midY = p.baseY + (tier.rows / 2) * p.rowRise
      toTgt = ringP(bMid, midO, midY)
      // stay BELOW the roofline: for upper tiers look up at the block from
      // beneath, never down through the canopy
      const camY = Math.min(midY + 9, 19)
      toPos = ringP(bMid, midO - 30, camY)
    } else if (type === 'city') {
      // aerial from over the city looking west — the Arabian Sea and the
      // setting sun sit behind the stadium
      toPos = new THREE.Vector3(430, 175, 260)
      toTgt = new THREE.Vector3(-40, 14, 0)
    } else {
      toPos = ORBIT_POS.clone()
      toTgt = ORBIT_TARGET.clone()
    }

    if (first.current) {
      first.current = false
      camera.position.copy(toPos)
      camera.lookAt(toTgt)
      if (controls.current) controls.current.target.copy(toTgt)
      return
    }

    const p0 = camera.position.clone()
    const fromTgt = controls.current ? controls.current.target.clone() : ORBIT_TARGET.clone()
    const mid = p0.clone().lerp(toPos, 0.35)
    mid.y = Math.max(p0.y, toPos.y) + (type === 'seat' ? 30 : 40)
    const outward = new THREE.Vector3(toPos.x, 0, toPos.z).normalize()
    const approach = type === 'seat'
      ? toPos.clone().addScaledVector(outward, 10).add(new THREE.Vector3(0, 10, 0))
      : toPos.clone().lerp(mid, 0.3)
    const curve = new THREE.CatmullRomCurve3([p0, mid, approach, toPos], false, 'catmullrom', 0.35)
    anim.current = { curve, fromTgt, toTgt, t: 0, dur: type === 'seat' ? 2.2 : 1.6 }
    if (controls.current) controls.current.enabled = false
  }, [focus.key]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, dt) => {
    const a = anim.current
    if (!a) return
    a.t = Math.min(1, a.t + dt / a.dur)
    const k = easeInOutCubic(a.t)
    a.curve.getPoint(k, camera.position)
    const tgt = new THREE.Vector3().lerpVectors(a.fromTgt, a.toTgt, smoothstep(a.t, 0.12, 0.85))
    if (controls.current) controls.current.target.copy(tgt)
    camera.lookAt(tgt)
    if (a.t >= 1) {
      anim.current = null
      if (controls.current) {
        controls.current.enabled = true
        controls.current.update()
      }
    }
  })

  // pause the planetary idle rotation while the user interacts; resume after 5 s
  const handleStart = () => {
    autoRotate.current = false
    if (idleTimer.current) clearTimeout(idleTimer.current)
  }
  const handleEnd = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => { autoRotate.current = true }, 5000)
  }
  useFrame(() => {
    if (controls.current) {
      controls.current.autoRotate =
        (focus.type === 'overview' || focus.type === 'city') && autoRotate.current && !anim.current
    }
  })

  const seatMode = focus.type === 'seat'
  const cityMode = focus.type === 'city'
  const blockMode = focus.type === 'block'
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      autoRotateSpeed={cityMode ? 0.35 : 0.5}
      onStart={handleStart}
      onEnd={handleEnd}
      enablePan={false}
      enableZoom={!seatMode}
      rotateSpeed={seatMode ? -0.35 : 0.7}
      minDistance={seatMode ? 0.1 : blockMode ? 8 : 25}
      maxDistance={seatMode ? 6 : cityMode ? 900 : 420}
      /* block mode looks UP at high tiers from below — don't clamp the camera
         back above the target (that was silently lifting it after arrival) */
      maxPolarAngle={seatMode ? Math.PI * 0.62 : blockMode ? Math.PI * 0.72 : Math.PI * 0.49}
    />
  )
}

export { ORBIT_POS, ORBIT_TARGET }
