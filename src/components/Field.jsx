import React, { useMemo } from 'react'
import * as THREE from 'three'
import { FIELD_RX, FIELD_RZ } from '../data/stadium.js'

// Elliptical grass outfield with mowing rings, pitch square, boundary rope
// and advertising boards around the edge.
export default function Field() {
  const grassRings = useMemo(() => {
    const rings = []
    const steps = 7
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps
      const t1 = (i + 1) / steps
      rings.push({
        rx0: FIELD_RX * t0, rz0: FIELD_RZ * t0,
        rx1: FIELD_RX * t1, rz1: FIELD_RZ * t1,
        color: i % 2 === 0 ? '#4caf50' : '#61c766',
      })
    }
    return rings
  }, [])

  const ringGeometries = useMemo(() =>
    grassRings.map(r => {
      const shape = new THREE.Shape()
      shape.absellipse(0, 0, r.rx1, r.rz1, 0, Math.PI * 2)
      if (r.rx0 > 0) {
        const hole = new THREE.Path()
        hole.absellipse(0, 0, r.rx0, r.rz0, 0, Math.PI * 2)
        shape.holes.push(hole)
      }
      return new THREE.ShapeGeometry(shape, 64)
    }), [grassRings])

  const boardsGeometry = useMemo(() => {
    // low advertising boards just outside the boundary
    const pts = []
    const N = 96
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.sin(a) * (FIELD_RX + 1.2), 0, -Math.cos(a) * (FIELD_RZ + 1.2)))
    }
    const curve = new THREE.CatmullRomCurve3(pts, true)
    return { curve }
  }, [])

  return (
    <group>
      {/* grass rings */}
      {ringGeometries.map((geo, i) => (
        <mesh key={i} geometry={geo} rotation-x={-Math.PI / 2} position-y={0.01 + i * 0.001} receiveShadow>
          <meshLambertMaterial color={grassRings[i].color} />
        </mesh>
      ))}

      {/* pitch square (lighter worn grass) */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <planeGeometry args={[18, 26]} />
        <meshLambertMaterial color="#a8b85e" />
      </mesh>

      {/* the match pitch strip */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.05}>
        <planeGeometry args={[3.05, 20.12]} />
        <meshLambertMaterial color="#dcc98e" />
      </mesh>

      {/* creases */}
      {[+1, -1].map(end => (
        <group key={end}>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.06, end * 8.94]}>
            <planeGeometry args={[3.66, 0.08]} />
            <meshBasicMaterial color="#f5f5f5" />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.06, end * 7.72]}>
            <planeGeometry args={[3.66, 0.08]} />
            <meshBasicMaterial color="#f5f5f5" />
          </mesh>
        </group>
      ))}

      {/* 30-yard circle (dashed feel via thin ring) */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <ringGeometry args={[27.3, 27.55, 96]} />
        <meshBasicMaterial color="#e8f5e9" transparent opacity={0.55} />
      </mesh>

      {/* boundary rope */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.04}>
        <ringGeometry args={[0.998, 1.0, 128]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <BoundaryRope />
      <AdBoards />
      <GroundDecals />
    </group>
  )
}

function BoundaryRope() {
  const geo = useMemo(() => {
    const pts = []
    const N = 128
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.sin(a) * (FIELD_RX - 1.5), 0.12, -Math.cos(a) * (FIELD_RZ - 1.5)))
    }
    const curve = new THREE.CatmullRomCurve3(pts, true)
    return new THREE.TubeGeometry(curve, 128, 0.12, 6, true)
  }, [])
  return (
    <mesh geometry={geo}>
      <meshLambertMaterial color="#fafafa" />
    </mesh>
  )
}

const boardTexture = (() => {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 64
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, 64)
  grad.addColorStop(0, '#1a63e8')
  grad.addColorStop(1, '#0b3ea8')
  g.fillStyle = grad
  g.fillRect(0, 0, 512, 64)
  g.fillStyle = '#ffffff'
  g.font = 'bold 34px Arial'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('MUMBAI INDIANS', 256, 33)
  const tex = new THREE.CanvasTexture(c)
  tex.anisotropy = 4
  return tex
})()

function AdBoards() {
  // ring of LED boards outside the boundary — MI blue with gold accents
  const { positions } = useMemo(() => {
    const positions = []
    const N = 48
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      const x = Math.sin(a) * (FIELD_RX + 1.6)
      const z = -Math.cos(a) * (FIELD_RZ + 1.6)
      positions.push({ x, z, rot: -a })
    }
    return { positions }
  }, [])
  return (
    <group>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, 0.45, p.z]} rotation-y={p.rot}>
          <boxGeometry args={[8.2, 0.9, 0.15]} />
          {i % 4 === 3 ? (
            <meshBasicMaterial color="#ffd93d" toneMapped={false} />
          ) : (
            <meshBasicMaterial map={boardTexture} toneMapped={false} />
          )}
        </mesh>
      ))}
    </group>
  )
}

function makeTataIplTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 192
  const g = c.getContext('2d')
  g.clearRect(0, 0, 512, 192)
  g.textAlign = 'center'
  g.fillStyle = '#f5a623'
  g.font = 'bold 78px "Rajdhani", Arial'
  g.fillText('TATA', 256, 72)
  g.fillStyle = '#e6eae0'
  g.font = 'bold 64px "Rajdhani", Arial'
  g.fillText('IPL 2026', 256, 150)
  const tex = new THREE.CanvasTexture(c)
  tex.anisotropy = 4
  return tex
}

function GroundDecals() {
  // The only painted marks on the outfield: TATA IPL behind BOTH ends,
  // centred on the stumps-to-stumps axis (the end-on broadcast camera
  // frames it). North copy reads from the south camera and vice-versa.
  const tataTex = useMemo(() => makeTataIplTexture(), [])
  return (
    <group>
      <mesh position={[0, 0.03, -21.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13, 7]} />
        <meshBasicMaterial map={tataTex} transparent toneMapped={false} opacity={0.92} />
      </mesh>
      <mesh position={[0, 0.03, 21.5]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <planeGeometry args={[13, 7]} />
        <meshBasicMaterial map={tataTex} transparent toneMapped={false} opacity={0.92} />
      </mesh>
    </group>
  )
}
