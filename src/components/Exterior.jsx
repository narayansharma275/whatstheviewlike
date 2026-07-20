import React, { useMemo } from 'react'
import * as THREE from 'three'
import { ringPoint } from './Roof.jsx'

// Wankhede from the outside: ribbed cream facade with warm, glowing concourse
// bands (a night match seen from Marine Drive), external stair towers, a lit
// plaza ring and a fringe of palm trees.
const WALL_OFFSET = 42
const WALL_TOP = 21

function stripGeo(a0, a1, o0, y0, o1, y1, segments = 96) {
  const pos = []
  for (let i = 0; i < segments; i++) {
    const t0 = a0 + ((a1 - a0) * i) / segments
    const t1 = a0 + ((a1 - a0) * (i + 1)) / segments
    pos.push(
      ringPoint(t0, o0, y0), ringPoint(t0, o1, y1), ringPoint(t1, o1, y1),
      ringPoint(t0, o0, y0), ringPoint(t1, o1, y1), ringPoint(t1, o0, y0)
    )
  }
  const g = new THREE.BufferGeometry()
  const arr = new Float32Array(pos.length * 3)
  pos.forEach((p, i) => { arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z })
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
  g.computeVertexNormals()
  return g
}

export default function Exterior() {
  const wallGeo = useMemo(() => stripGeo(0, 360, WALL_OFFSET, 0, WALL_OFFSET, WALL_TOP, 128), [])
  const corniceGeo = useMemo(() => stripGeo(0, 360, WALL_OFFSET - 0.5, WALL_TOP, WALL_OFFSET + 1.5, WALL_TOP + 1.2, 128), [])
  const bandLow = useMemo(() => stripGeo(0, 360, WALL_OFFSET + 0.15, 4.2, WALL_OFFSET + 0.15, 7.2, 128), [])
  const bandHigh = useMemo(() => stripGeo(0, 360, WALL_OFFSET + 0.15, 11.2, WALL_OFFSET + 0.15, 13.8, 128), [])
  const plazaGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.absellipse(0, 0, 60 + WALL_OFFSET + 24, 66 + WALL_OFFSET + 24, 0, Math.PI * 2)
    const hole = new THREE.Path()
    hole.absellipse(0, 0, 60 + WALL_OFFSET + 4, 66 + WALL_OFFSET + 4, 0, Math.PI * 2)
    shape.holes.push(hole)
    return new THREE.ShapeGeometry(shape, 64)
  }, [])

  const ribs = useMemo(() => {
    const arr = []
    for (let a = 0; a < 360; a += 5) {
      const p = ringPoint(a, WALL_OFFSET + 0.4, 0)
      arr.push({ p, yaw: Math.atan2(-p.x, -p.z) })
    }
    return arr
  }, [])

  const towers = useMemo(
    () => [20, 70, 110, 160, 200, 250, 290, 340].map(a => {
      const p = ringPoint(a, WALL_OFFSET + 4, 0)
      return { p }
    }),
    []
  )

  const palms = useMemo(() => {
    const arr = []
    for (let i = 0; i < 30; i++) {
      const a = i * 12 + (i % 3) * 2.5
      const p = ringPoint(a, WALL_OFFSET + 16 + (i % 4) * 3, 0)
      arr.push({ p, h: 6.5 + (i % 3) * 1.5, rot: i * 1.3 })
    }
    return arr
  }, [])

  return (
    <group>
      {/* facade wall */}
      <mesh geometry={wallGeo}>
        <meshLambertMaterial color="#c9c4b4" side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={corniceGeo}>
        <meshLambertMaterial color="#e3dfd2" side={THREE.DoubleSide} />
      </mesh>
      {/* glowing concourse bands — the stadium reads "on" from outside */}
      <mesh geometry={bandLow}>
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={bandHigh}>
        <meshBasicMaterial color="#ffe6bd" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* vertical ribs */}
      {ribs.map((r, i) => (
        <mesh key={i} position={[r.p.x, WALL_TOP / 2, r.p.z]} rotation-y={r.yaw}>
          <boxGeometry args={[1.1, WALL_TOP, 0.9]} />
          <meshLambertMaterial color="#b5b0a0" />
        </mesh>
      ))}
      {/* stair towers */}
      {towers.map((t, i) => (
        <group key={i} position={[t.p.x, 0, t.p.z]}>
          <mesh position={[0, 11, 0]}>
            <cylinderGeometry args={[3.4, 3.6, 22, 12]} />
            <meshLambertMaterial color="#d4cfc0" />
          </mesh>
          <mesh position={[0, 22.4, 0]}>
            <cylinderGeometry args={[3.9, 3.9, 0.8, 12]} />
            <meshLambertMaterial color="#e3dfd2" />
          </mesh>
        </group>
      ))}
      {/* plaza ring */}
      <mesh geometry={plazaGeo} rotation-x={-Math.PI / 2} position-y={-0.05}>
        <meshLambertMaterial color="#232a3d" />
      </mesh>
      {/* palms around the plaza */}
      {palms.map((t, i) => (
        <group key={i} position={[t.p.x, 0, t.p.z]} rotation-y={t.rot}>
          <mesh position={[0, t.h / 2, 0]}>
            <cylinderGeometry args={[0.18, 0.3, t.h, 6]} />
            <meshLambertMaterial color="#6d5b3f" />
          </mesh>
          {[0, 1, 2, 3, 4].map(k => (
            <mesh
              key={k}
              position={[Math.sin(k * 1.256) * 1.3, t.h + 0.3, Math.cos(k * 1.256) * 1.3]}
              rotation={[0.5 * Math.cos(k * 1.256), 0, -0.5 * Math.sin(k * 1.256)]}
            >
              <coneGeometry args={[0.5, 2.6, 4]} />
              <meshLambertMaterial color="#3e7d46" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
