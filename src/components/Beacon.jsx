import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ringPoint } from './Roof.jsx'

// A wide curved curtain of light that rises from the top of a whole stand (or
// one block's arc) and fades out high above the roof — so your selection is
// findable from any camera angle, even on the far side of the bowl. The whole
// stand reads as "lit", not a single pin. (The map-marker / aurora pattern.)

const CURTAIN_HEIGHT = 40

// vertical gradient: bright at the base of the curtain, transparent at the top
const curtainTexture = (() => {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 128
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 128, 0, 0)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.2, 'rgba(255,255,255,0.8)')
  grad.addColorStop(0.65, 'rgba(255,255,255,0.22)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 4, 128)
  return new THREE.CanvasTexture(c)
})()

// curved vertical strip following the arc a0→a1 at radial `offset`,
// from y=baseY up to y=baseY+height
function curtainGeometry(a0, a1, offset, baseY, height, segments) {
  const pos = []
  const uv = []
  for (let i = 0; i < segments; i++) {
    const t0 = a0 + ((a1 - a0) * i) / segments
    const t1 = a0 + ((a1 - a0) * (i + 1)) / segments
    const b0 = ringPoint(t0, offset, baseY)
    const b1 = ringPoint(t1, offset, baseY)
    const u0 = ringPoint(t0, offset, baseY + height)
    const u1 = ringPoint(t1, offset, baseY + height)
    const uA = i / segments
    const uB = (i + 1) / segments
    pos.push(b0, u0, u1, b0, u1, b1)
    uv.push(uA, 0, uA, 1, uB, 1, uA, 0, uB, 1, uB, 0)
  }
  const g = new THREE.BufferGeometry()
  const arr = new Float32Array(pos.length * 3)
  pos.forEach((p, i) => { arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z })
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2))
  return g
}

function Curtain({ arc, color, phase = 0 }) {
  const matRef = useRef()
  const capRef = useRef()
  const geo = useMemo(
    () => curtainGeometry(arc.a0, arc.a1, arc.offset, arc.baseY, CURTAIN_HEIGHT, Math.max(6, Math.round((arc.a1 - arc.a0) / 4))),
    [arc]
  )
  const capGeo = useMemo(
    () => curtainGeometry(arc.a0, arc.a1, arc.offset, arc.baseY - 1.5, 2.2, Math.max(6, Math.round((arc.a1 - arc.a0) / 4))),
    [arc]
  )
  const col = useMemo(() => new THREE.Color(color), [color])

  useFrame(({ clock }) => {
    const pulse = 0.4 + 0.16 * Math.sin(clock.getElapsedTime() * 2.1 + phase)
    if (matRef.current) matRef.current.opacity = pulse
    if (capRef.current) capRef.current.opacity = 0.5 + 0.2 * Math.sin(clock.getElapsedTime() * 2.1 + phase)
  })

  return (
    <group>
      {/* the tall light curtain */}
      <mesh geometry={geo}>
        <meshBasicMaterial
          ref={matRef}
          map={curtainTexture}
          color={col}
          transparent
          opacity={0.42}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>
      {/* bright base band sitting on the top of the stand */}
      <mesh geometry={capGeo}>
        <meshBasicMaterial
          ref={capRef}
          color={col}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>
    </group>
  )
}

// beams: array of { key, arc:{a0,a1,offset,baseY}, color }
export default function Beacon({ beams }) {
  return (
    <group>
      {beams.map((b, i) => (
        <Curtain key={b.key} arc={b.arc} color={b.color} phase={i * 1.7} />
      ))}
    </group>
  )
}
