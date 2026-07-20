import React, { useMemo } from 'react'
import * as THREE from 'three'
import { FIELD_RX, FIELD_RZ, STAND_GAP } from '../data/stadium.js'

const DEG = Math.PI / 180

// Wankhede's signature suspended roof: white PTFE (Teflon) fabric on ~45
// radial trusses tied by compression rings — a scalloped white halo over the
// whole bowl with no pillars in front of spectators. The scallop is faked by
// dipping the inner edge of each fabric bay between trusses.
export default function Roof({ innerOffset = 14, outerOffset = 34, yInner = 28.5, yOuter = 33, bays = 45 }) {
  const fabric = useMemo(() => {
    const geos = []
    const span = 360 / bays
    for (let i = 0; i < bays; i++) {
      geos.push(scallopBay(i * span, (i + 1) * span, innerOffset, yInner, outerOffset, yOuter))
    }
    return geos
  }, [bays, innerOffset, outerOffset, yInner, yOuter])

  const trussAngles = useMemo(
    () => Array.from({ length: bays }, (_, i) => i * (360 / bays)),
    [bays]
  )

  const rimGeo = useMemo(
    () => stripGeo(0, 360, innerOffset, yInner, innerOffset, yInner - 0.9, 128),
    [innerOffset, yInner]
  )

  return (
    <group>
      {fabric.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshLambertMaterial color="#eef0f5" side={THREE.DoubleSide} emissive="#3a3f52" emissiveIntensity={0.25} />
        </mesh>
      ))}
      {/* radial truss lines under the fabric */}
      {trussAngles.map((a, i) => {
        const p0 = ringPoint(a, innerOffset, yInner)
        const p1 = ringPoint(a, outerOffset, yOuter)
        const mid = p0.clone().add(p1).multiplyScalar(0.5)
        const len = p0.distanceTo(p1)
        const dir = p1.clone().sub(p0)
        const yaw = Math.atan2(dir.x, dir.z)
        const pitch = Math.atan2(dir.y, Math.hypot(dir.x, dir.z))
        return (
          <mesh key={i} position={mid} rotation={[pitch > 0 ? -pitch + Math.PI / 2 : Math.PI / 2 - pitch, yaw, 0, 'YXZ']}>
            <cylinderGeometry args={[0.18, 0.18, len, 6]} />
            <meshLambertMaterial color="#aeb4c4" />
          </mesh>
        )
      })}
      {/* inner compression-ring edge beam */}
      <mesh geometry={rimGeo}>
        <meshLambertMaterial color="#c3c8d4" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export function ringPoint(aDeg, o, y) {
  const a = aDeg * DEG
  return new THREE.Vector3(
    Math.sin(a) * (FIELD_RX + STAND_GAP + o),
    y,
    -Math.cos(a) * (FIELD_RZ + STAND_GAP + o)
  )
}

// fabric bay whose inner edge sags mid-bay → scalloped silhouette
function scallopBay(a0, a1, o0, y0, o1, y1, segments = 8) {
  const pos = []
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments
    const t1 = (i + 1) / segments
    const sag0 = Math.sin(t0 * Math.PI) * 1.1
    const sag1 = Math.sin(t1 * Math.PI) * 1.1
    const aA = a0 + (a1 - a0) * t0
    const aB = a0 + (a1 - a0) * t1
    const p00 = ringPoint(aA, o0, y0 - sag0)
    const p01 = ringPoint(aB, o0, y0 - sag1)
    const p10 = ringPoint(aA, o1, y1)
    const p11 = ringPoint(aB, o1, y1)
    pos.push(p00, p10, p11, p00, p11, p01)
  }
  return toGeometry(pos)
}

function stripGeo(a0, a1, o0, y0, o1, y1, segments = 12) {
  const pos = []
  for (let i = 0; i < segments; i++) {
    const t0 = a0 + ((a1 - a0) * i) / segments
    const t1 = a0 + ((a1 - a0) * (i + 1)) / segments
    pos.push(
      ringPoint(t0, o0, y0), ringPoint(t0, o1, y1), ringPoint(t1, o1, y1),
      ringPoint(t0, o0, y0), ringPoint(t1, o1, y1), ringPoint(t1, o0, y0)
    )
  }
  return toGeometry(pos)
}

function toGeometry(pos) {
  const g = new THREE.BufferGeometry()
  const arr = new Float32Array(pos.length * 3)
  pos.forEach((p, i) => { arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z })
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
  g.computeVertexNormals()
  return g
}
