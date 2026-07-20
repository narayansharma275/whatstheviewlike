import React, { useMemo } from 'react'
import * as THREE from 'three'
import { FIELD_RX, FIELD_RZ, STAND_GAP, NET_TOP, NET_OFFSET } from '../data/stadium.js'

const DEG = Math.PI / 180

function makeNetTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  g.clearRect(0, 0, 64, 64)
  g.strokeStyle = 'rgba(210, 215, 225, 0.95)'
  g.lineWidth = 2
  // diamond mesh pattern
  g.beginPath()
  g.moveTo(0, 32); g.lineTo(32, 0); g.lineTo(64, 32); g.lineTo(32, 64); g.closePath()
  g.stroke()
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

// The protective netting ring in front of the Level 1 seats — the thing
// ticket apps never show you. Semi-transparent diamond mesh on slim poles.
export default function Netting() {
  const tex = useMemo(() => makeNetTexture(), [])
  const { netGeo, poles } = useMemo(() => {
    const rx = FIELD_RX + STAND_GAP + NET_OFFSET
    const rz = FIELD_RZ + STAND_GAP + NET_OFFSET
    const N = 128
    const pos = []
    const uv = []
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2
      const a1 = ((i + 1) / N) * Math.PI * 2
      const p0 = [Math.sin(a0) * rx, -Math.cos(a0) * rz]
      const p1 = [Math.sin(a1) * rx, -Math.cos(a1) * rz]
      pos.push(
        p0[0], 0, p0[1], p1[0], 0, p1[1], p1[0], NET_TOP, p1[1],
        p0[0], 0, p0[1], p1[0], NET_TOP, p1[1], p0[0], NET_TOP, p0[1]
      )
      const u0 = i * 4, u1 = (i + 1) * 4
      uv.push(u0, 0, u1, 0, u1, 6, u0, 0, u1, 6, u0, 6)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3))
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2))
    g.computeVertexNormals()

    const poles = []
    const P = 40
    for (let i = 0; i < P; i++) {
      const a = (i / P) * 360 * DEG
      poles.push([Math.sin(a) * rx, -Math.cos(a) * rz])
    }
    return { netGeo: g, poles }
  }, [])

  return (
    <group>
      <mesh geometry={netGeo}>
        <meshBasicMaterial
          map={tex}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {poles.map((p, i) => (
        <mesh key={i} position={[p[0], NET_TOP / 2, p[1]]}>
          <cylinderGeometry args={[0.07, 0.07, NET_TOP, 6]} />
          <meshLambertMaterial color="#5b6270" />
        </mesh>
      ))}
    </group>
  )
}
