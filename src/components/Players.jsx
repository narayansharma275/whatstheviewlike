import React, { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// Animated match loop: MI batting (blue & gold) vs RCB fielding (red & black).
// Repeating ~13 s montage, cycling through three shots:
//   0: lofted straight six over long-off
//   1: cover drive along the ground (batsmen run 2)
//   2: pull to deep square leg (batsmen run 2)
// Phases within a cycle: run-up (0–2.6) → delivery (2.6–3.1) → shot & chase
// (3.1–7.5) → reset (7.5–13).
const CYCLE = 13

const MI_SHIRT = '#1e88e5'
const MI_TRIM = '#c9a227'
const RCB_SHIRT = '#d32f2f'
const RCB_TRIM = '#1a1a1a'
const UMPIRE = '#546e7a'

const easeIn = t => t * t
const clamp01 = t => Math.min(1, Math.max(0, t))

function Player({ innerRef, shirt, trim, crouch = false, bat = false }) {
  const h = crouch ? 0.78 : 1.0
  return (
    <group ref={innerRef}>
      <group scale={[1, h, 1]}>
        {/* legs */}
        {[-0.09, 0.09].map(x => (
          <mesh key={x} position={[x, 0.38, 0]}>
            <cylinderGeometry args={[0.055, 0.07, 0.76, 6]} />
            <meshLambertMaterial color={bat ? '#e8e8ec' : trim} />
          </mesh>
        ))}
        {/* batting pads */}
        {bat && [-0.09, 0.09].map(x => (
          <mesh key={'p' + x} position={[x, 0.34, 0.05]}>
            <cylinderGeometry args={[0.075, 0.085, 0.62, 6]} />
            <meshLambertMaterial color="#f4f6fb" />
          </mesh>
        ))}
        {/* hips */}
        <mesh position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.15, 0.13, 0.18, 8]} />
          <meshLambertMaterial color={trim} />
        </mesh>
        {/* torso */}
        <mesh position={[0, 1.08, 0]}>
          <cylinderGeometry args={[0.19, 0.155, 0.5, 8]} />
          <meshLambertMaterial color={shirt} />
        </mesh>
        {/* arms */}
        {[-1, 1].map(s => (
          <mesh key={s} position={[s * 0.24, 1.05, 0.02]} rotation-z={s * 0.28}>
            <cylinderGeometry args={[0.045, 0.055, 0.52, 6]} />
            <meshLambertMaterial color={shirt} />
          </mesh>
        ))}
        {/* head */}
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.13, 10, 10]} />
          <meshLambertMaterial color="#b07a5a" />
        </mesh>
        {/* helmet (batters) or cap */}
        {bat ? (
          <group position={[0, 1.52, 0]}>
            <mesh>
              <sphereGeometry args={[0.145, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
              <meshLambertMaterial color={shirt} />
            </mesh>
            <mesh position={[0, -0.05, 0.12]} rotation-x={0.35}>
              <boxGeometry args={[0.22, 0.02, 0.14]} />
              <meshLambertMaterial color="#20242c" />
            </mesh>
          </group>
        ) : (
          <mesh position={[0, 1.58, 0]}>
            <sphereGeometry args={[0.135, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshLambertMaterial color={shirt} />
          </mesh>
        )}
        {bat && (
          <mesh position={[0.3, 0.55, 0.1]} rotation-z={-0.5}>
            <boxGeometry args={[0.1, 0.78, 0.17]} />
            <meshLambertMaterial color="#e0c589" />
          </mesh>
        )}
      </group>
    </group>
  )
}

// shot targets on the boundary (x, z) + flight style
const SHOTS = [
  { target: [6, -62], lofted: true, runs: 0 },    // straight six over long-off (north end)
  { target: [48, -30], lofted: false, runs: 2 },  // cover drive
  { target: [-52, 18], lofted: false, runs: 2 },  // pull to deep square leg
]

const FIELD_BASE = [
  [14, -18], [-15, -16], [22, -4], [26, 6], [-24, 2],
  [-18, 14], [16, 15], [38, -28], [-36, -30],
]

export default function Players() {
  const bowler = useRef()
  const striker = useRef()
  const nonStriker = useRef()
  const keeper = useRef()
  const slip = useRef()
  const ball = useRef()
  const fielders = useRef([])
  const lastCheer = useRef(-1)

  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime()
    const t = elapsed % CYCLE
    const cycleIdx = Math.floor(elapsed / CYCLE)
    const shot = SHOTS[cycleIdx % SHOTS.length]

    // ── bowler: run-up from mark to crease, follow-through, walk back
    if (bowler.current) {
      let bx = -0.6, bz = -24, bob = 0
      if (t < 2.6) {
        const k = easeIn(t / 2.6)
        bz = -24 + k * 12.2 // to -11.8
        bob = Math.abs(Math.sin(t * 14)) * 0.14
      } else if (t < 4.2) {
        bz = -11.8 + clamp01((t - 2.6) / 1.6) * 2.2 // follow-through drift
      } else if (t < 7.5) {
        bz = -9.6
      } else {
        const k = clamp01((t - 7.5) / 5.5)
        bz = -9.6 - k * 14.4 // walk back to mark
        bob = Math.abs(Math.sin(t * 6)) * 0.05
      }
      bowler.current.position.set(bx, bob, bz)
    }

    // ── ball
    if (ball.current) {
      let bp = null
      if (t >= 2.6 && t < 3.1) {
        // delivery: release to bat
        const k = (t - 2.6) / 0.5
        bp = v.set(0.2, 1.9 - k * 1.2 + Math.sin(k * Math.PI) * -0.3, -9.5 + k * 17.7)
      } else if (t >= 3.1 && t < 6.2) {
        // off the bat toward the boundary
        const k = clamp01((t - 3.1) / (shot.lofted ? 2.6 : 2.0))
        const x = 0.2 + (shot.target[0] - 0.2) * k
        const z = 8.2 + (shot.target[1] - 8.2) * k
        const y = shot.lofted
          ? 0.8 + Math.sin(k * Math.PI) * 16
          : Math.max(0.12, 0.8 - k * 0.68) + Math.abs(Math.sin(k * Math.PI * 3)) * (1 - k) * 0.5
        bp = v.set(x, y, z)
        // fire the crowd-roar event once per cycle at the moment of contact
        if (lastCheer.current !== cycleIdx && k > 0.02) {
          lastCheer.current = cycleIdx
          window.dispatchEvent(new CustomEvent('wankhede-boundary', { detail: { six: shot.lofted } }))
        }
      }
      if (bp) {
        ball.current.visible = true
        ball.current.position.copy(bp)
      } else {
        ball.current.visible = false
      }
    }

    // ── batsmen: face up, then run twos on ground shots
    const runPhase = shot.runs > 0 && t >= 3.4 && t < 7.5
    if (striker.current && nonStriker.current) {
      if (runPhase) {
        const k = clamp01((t - 3.4) / 4.1)
        // two runs: out and back (triangle wave)
        const leg = k < 0.5 ? k * 2 : (1 - k) * 2
        const bob = Math.abs(Math.sin(t * 12)) * 0.1
        striker.current.position.set(0.7, bob, 8.2 - leg * 16.8)
        nonStriker.current.position.set(1.2, bob, -8.6 + leg * 16.8)
      } else {
        striker.current.position.set(0.7, 0, 8.2)
        nonStriker.current.position.set(1.2, 0, -8.6)
      }
      striker.current.rotation.y = Math.PI
    }

    // ── chasing fielder: nearest base fielder runs toward the ball's target
    fielders.current.forEach((f, i) => {
      if (!f) return
      const base = FIELD_BASE[i]
      let px = base[0], pz = base[1], bob = 0
      if (t >= 3.4 && t < 7.5) {
        // fielder closest to the shot target gives chase
        const d = Math.hypot(base[0] - shot.target[0], base[1] - shot.target[1])
        if (d < 42) {
          const k = clamp01((t - 3.4) / 4.1)
          const chase = Math.min(1, 42 / Math.max(d, 1)) * 0.55
          px = base[0] + (shot.target[0] - base[0]) * k * chase
          pz = base[1] + (shot.target[1] - base[1]) * k * chase
          bob = Math.abs(Math.sin(t * 12)) * 0.1
        }
      } else if (t >= 7.5) {
        const k = clamp01((t - 7.5) / 4)
        const d = Math.hypot(base[0] - shot.target[0], base[1] - shot.target[1])
        if (d < 42) {
          const chase = Math.min(1, 42 / Math.max(d, 1)) * 0.55
          const fx = base[0] + (shot.target[0] - base[0]) * chase
          const fz = base[1] + (shot.target[1] - base[1]) * chase
          px = fx + (base[0] - fx) * k
          pz = fz + (base[1] - fz) * k
        }
      }
      f.position.set(px, bob, pz)
      f.rotation.y = Math.atan2(-px, -pz)
    })

    // keeper & slip crouch-sway
    if (keeper.current) keeper.current.position.set(0, Math.sin(elapsed * 2) * 0.02, 12.3)
    if (slip.current) slip.current.position.set(3.2, Math.sin(elapsed * 2 + 1) * 0.02, 12.8)
  })

  return (
    <group>
      <Player innerRef={striker} shirt={MI_SHIRT} trim={MI_TRIM} bat />
      <Player innerRef={nonStriker} shirt={MI_SHIRT} trim={MI_TRIM} bat />
      <Player innerRef={bowler} shirt={RCB_SHIRT} trim={RCB_TRIM} />
      <Player innerRef={keeper} shirt={RCB_SHIRT} trim={RCB_TRIM} crouch />
      <Player innerRef={slip} shirt={RCB_SHIRT} trim={RCB_TRIM} crouch />
      {FIELD_BASE.map((p, i) => (
        <Player key={i} innerRef={el => (fielders.current[i] = el)} shirt={RCB_SHIRT} trim={RCB_TRIM} />
      ))}
      {/* umpires */}
      <group position={[0, 0, -13.4]}><Player shirt={UMPIRE} trim="#263238" /></group>
      <group position={[-23, 0, 8]}><Player shirt={UMPIRE} trim="#263238" /></group>

      {/* the ball */}
      <mesh ref={ball} visible={false}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* stumps */}
      {[+1, -1].map(end => (
        <group key={end} position={[0, 0, end * 10.06]}>
          {[-0.11, 0, 0.11].map((x, i) => (
            <mesh key={i} position={[x, 0.36, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.72, 6]} />
              <meshLambertMaterial color="#e0c589" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
