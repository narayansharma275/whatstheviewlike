import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// South Mumbai around Wankhede, compass-true to the model (north = -Z):
// Arabian Sea + Marine Drive + Queen's Necklace to the WEST (-X), the Western
// Railway corridor with a running local train to the EAST (+X), art-deco
// mid-rises everywhere, the Nariman Point tower cluster to the SOUTH (+Z),
// Malabar Hill towers to the NORTH-WEST, and the athletics track next door.
const srand = i => {
  const x = Math.sin(i * 91.7 + 47.3) * 24634.5453
  return x - Math.floor(x)
}

function SunsetSky() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 512
    const g = c.getContext('2d')
    const grad = g.createLinearGradient(0, 0, 0, 512)
    grad.addColorStop(0, '#37457e')
    grad.addColorStop(0.42, '#6f5d95')
    grad.addColorStop(0.62, '#c76f7e')
    grad.addColorStop(0.74, '#ff9e63')
    grad.addColorStop(0.82, '#ffc98a')
    grad.addColorStop(1, '#ffc98a')
    g.fillStyle = grad
    g.fillRect(0, 0, 64, 512)
    return new THREE.CanvasTexture(c)
  }, [])
  return (
    <group>
      <mesh>
        <sphereGeometry args={[2000, 24, 24]} />
        <meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} toneMapped={false} />
      </mesh>
      {/* the setting sun over the Arabian Sea (west) */}
      <mesh position={[-1750, 130, 180]} rotation-y={Math.PI / 2}>
        <circleGeometry args={[95, 32]} />
        <meshBasicMaterial color="#ffe9b8" fog={false} toneMapped={false} />
      </mesh>
      <mesh position={[-1740, 130, 180]} rotation-y={Math.PI / 2}>
        <circleGeometry args={[190, 32]} />
        <meshBasicMaterial color="#ff9e63" transparent opacity={0.35} fog={false} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Sea() {
  const boats = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => ({
        x: -380 - srand(i * 7) * 500,
        z: -700 + srand(i * 13) * 1400,
        rot: srand(i * 17) * Math.PI,
      })),
    []
  )
  return (
    <group>
      {/* the Back Bay — unmistakably blue; fog disabled so distance never
          browns the water */}
      {/* water sits ABOVE the global ground disc (-0.2) to avoid z-fighting */}
      <mesh rotation-x={-Math.PI / 2} position={[-1050, -0.1, 0]}>
        <planeGeometry args={[1700, 3600]} />
        <meshBasicMaterial color="#1e6fb8" toneMapped={false} fog={false} />
      </mesh>
      {/* the bay wraps the southern tip too (Nariman Point is a peninsula) */}
      <mesh rotation-x={-Math.PI / 2} position={[-100, -0.1, 1350]}>
        <planeGeometry args={[2600, 1200]} />
        <meshBasicMaterial color="#1e6fb8" toneMapped={false} fog={false} />
      </mesh>
      {/* lighter shallows near the shore */}
      <mesh rotation-x={-Math.PI / 2} position={[-330, -0.06, 0]}>
        <planeGeometry args={[130, 2400]} />
        <meshBasicMaterial color="#3f97dd" toneMapped={false} fog={false} />
      </mesh>
      {/* sunset glint lane across the water toward the sun */}
      <mesh rotation-x={-Math.PI / 2} position={[-900, -0.02, 150]}>
        <planeGeometry args={[1300, 130]} />
        <meshBasicMaterial color="#ffb478" transparent opacity={0.55} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* wave bands */}
      {[-430, -560, -730, -930, -1150].map((x, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, -0.04, i % 2 ? -300 : 260]}>
          <planeGeometry args={[24, 2100]} />
          <meshBasicMaterial color="#9fd4ff" transparent opacity={0.3} depthWrite={false} fog={false} />
        </mesh>
      ))}
      {/* tetrapod seawall + surf line along the promenade */}
      <mesh rotation-x={-Math.PI / 2} position={[-266, 0.01, 0]}>
        <planeGeometry args={[22, 2400]} />
        <meshLambertMaterial color="#8b8f97" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-281, 0.02, 0]}>
        <planeGeometry args={[10, 2400]} />
        <meshBasicMaterial color="#cfeaff" transparent opacity={0.75} /></mesh>
      {/* fishing boats scattered on the bay */}
      {boats.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation-y={b.rot}>
          <mesh position-y={0.5}>
            <boxGeometry args={[3.2, 1, 9]} />
            <meshLambertMaterial color={i % 2 ? '#c94f3d' : '#3d64c9'} />
          </mesh>
          <mesh position-y={3}>
            <cylinderGeometry args={[0.12, 0.12, 5, 5]} />
            <meshLambertMaterial color="#6d5b3f" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function MarineDrive() {
  const lights = useMemo(() => {
    const arr = []
    for (let z = -1100; z <= 1100; z += 34) arr.push(z)
    return arr
  }, [])
  return (
    <group>
      {/* promenade + seawall */}
      <mesh rotation-x={-Math.PI / 2} position={[-248, 0.02, 0]}>
        <planeGeometry args={[14, 2300]} />
        <meshLambertMaterial color="#4a4f5e" />
      </mesh>
      {/* the road */}
      <mesh rotation-x={-Math.PI / 2} position={[-228, 0.04, 0]}>
        <planeGeometry args={[24, 2300]} />
        <meshLambertMaterial color="#23272f" />
      </mesh>
      {/* centre line */}
      <mesh rotation-x={-Math.PI / 2} position={[-228, 0.06, 0]}>
        <planeGeometry args={[0.5, 2300]} />
        <meshBasicMaterial color="#8a8f9c" />
      </mesh>
      {/* Queen's Necklace — the amber curve of streetlights */}
      {lights.map(z => (
        <group key={z} position={[-244, 0, z]}>
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 8, 5]} />
            <meshLambertMaterial color="#3c414e" />
          </mesh>
          <mesh position={[0, 8.2, 0]}>
            <sphereGeometry args={[0.75, 8, 8]} />
            <meshBasicMaterial color="#ffb84d" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Buildings() {
  const ref = useRef()
  const towers = useRef()
  const blocks = useMemo(() => {
    const arr = []
    // art-deco strip along Marine Drive — with a gap where the university
    // ground and the stadium itself face the sea directly
    for (let z = -1050; z < 1050; z += 26) {
      if (z > -160 && z < 160) continue
      const i = arr.length
      arr.push({ x: -200 + srand(i) * 10, z, w: 20, h: 10 + srand(i + 1) * 8, d: 22, tone: 0 })
    }
    // city blocks: north, south, east of the stadium
    const zones = [
      { x0: 160, x1: 700, z0: -700, z1: 700 },    // east beyond the railway
      { x0: -700, x1: 120, z0: -800, z1: -220 },  // north
      { x0: -180, x1: 700, z0: 220, z1: 800 },    // south
    ]
    zones.forEach((zn, zi) => {
      const count = 70
      for (let k = 0; k < count; k++) {
        const i = arr.length
        const x = zn.x0 + srand(i * 3 + zi) * (zn.x1 - zn.x0)
        const z = zn.z0 + srand(i * 7 + zi) * (zn.z1 - zn.z0)
        if (Math.hypot(x, z) < 260) continue
        arr.push({ x, z, w: 16 + srand(i + 5) * 18, h: 8 + srand(i + 9) * 18, d: 16 + srand(i + 13) * 18, tone: 1 })
      }
    })
    return arr
  }, [])

  const skyscrapers = useMemo(() => {
    const arr = []
    // Nariman Point cluster (south)
    for (let k = 0; k < 16; k++) {
      arr.push({
        x: -80 + srand(k * 11) * 320,
        z: 330 + srand(k * 17) * 260,
        w: 22 + srand(k + 3) * 14,
        h: 55 + srand(k + 7) * 75,
        d: 22 + srand(k + 5) * 14,
      })
    }
    // Malabar Hill towers (north-west)
    for (let k = 20; k < 30; k++) {
      arr.push({
        x: -520 + srand(k * 13) * 240,
        z: -600 + srand(k * 19) * 240,
        w: 20 + srand(k + 3) * 12,
        h: 45 + srand(k + 7) * 65,
        d: 20 + srand(k + 5) * 12,
      })
    }
    return arr
  }, [])

  useMemoInstanced(ref, blocks, i => {
    const tones = ['#cfc6ae', '#d8d2c2', '#bfb9a8', '#a8a396', '#c9bfae']
    return tones[Math.floor(srand(i + 41) * tones.length)]
  })
  useMemoInstanced(towers, skyscrapers, i => {
    const tones = ['#3d4c66', '#46567a', '#54627e', '#5d6b8a']
    return tones[Math.floor(srand(i + 43) * tones.length)]
  })

  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, blocks.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={towers} args={[undefined, undefined, skyscrapers.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial emissive="#2c3752" emissiveIntensity={0.55} />
      </instancedMesh>
    </group>
  )
}

function useMemoInstanced(ref, items, colorFor) {
  React.useLayoutEffect(() => {
    if (!ref.current) return
    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    items.forEach((b, i) => {
      m.makeScale(b.w, b.h, b.d)
      m.setPosition(b.x, b.h / 2, b.z)
      ref.current.setMatrixAt(i, m)
      ref.current.setColorAt(i, c.set(colorFor(i)))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [ref, items, colorFor])
}

function Railway() {
  const train = useRef()
  useFrame(({ clock }) => {
    if (train.current) {
      const t = clock.getElapsedTime()
      train.current.position.z = ((t * 34) % 1500) - 750
    }
  })
  return (
    <group>
      {/* rail corridor bed */}
      <mesh rotation-x={-Math.PI / 2} position={[172, 0.01, 0]}>
        <planeGeometry args={[42, 2000]} />
        <meshLambertMaterial color="#1b1e26" />
      </mesh>
      {/* 4 tracks (2 slow + 2 fast, Churchgate line) */}
      {[160, 167, 177, 184].map(x => (
        <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.05, 0]}>
          <planeGeometry args={[0.6, 2000]} />
          <meshBasicMaterial color="#6f7688" />
        </mesh>
      ))}
      {/* Churchgate platforms ~500 m to the SSE */}
      {[154, 190].map(x => (
        <mesh key={x} position={[x, 0.7, 400]}>
          <boxGeometry args={[6, 1.4, 200]} />
          <meshLambertMaterial color="#8a8577" />
        </mesh>
      ))}
      {/* a Mumbai local rumbling through */}
      <group ref={train} position={[167, 0, 0]}>
        {Array.from({ length: 9 }).map((_, i) => (
          <group key={i} position={[0, 1.6, i * 13.4]}>
            <mesh>
              <boxGeometry args={[3.2, 3.2, 12.6]} />
              <meshLambertMaterial color={i % 2 ? '#6a55a4' : '#7562b5'} />
            </mesh>
            <mesh position={[1.62, 0.3, 0]}>
              <boxGeometry args={[0.05, 0.9, 11.8]} />
              <meshBasicMaterial color="#ffe9b0" toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function Cars() {
  const refs = useRef([])
  const cars = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        lane: i % 2 ? -222 : -234,
        dir: i % 2 ? 1 : -1,
        speed: 26 + srand(i) * 18,
        offset: srand(i + 99) * 1600,
        color: ['#d9dbe3', '#c23b3b', '#3b64c2', '#c2a23b', '#3bc287'][i % 5],
      })),
    []
  )
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    cars.forEach((car, i) => {
      const el = refs.current[i]
      if (!el) return
      const z = ((car.offset + t * car.speed) % 1600) - 800
      el.position.set(car.lane, 0.7, car.dir > 0 ? z : -z)
    })
  })
  return (
    <group>
      {cars.map((car, i) => (
        <group key={i} ref={el => (refs.current[i] = el)}>
          <mesh>
            <boxGeometry args={[1.8, 1.1, 4]} />
            <meshLambertMaterial color={car.color} />
          </mesh>
          <mesh position={[0, 0.1, car.dir > 0 ? -2.05 : 2.05]}>
            <planeGeometry args={[1.5, 0.5]} />
            <meshBasicMaterial color="#fff6cf" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function UniversityGround() {
  // the flat green Mumbai University sports oval directly WEST of the stadium
  return (
    <group position={[-172, 0, 20]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <circleGeometry args={[46, 40]} />
        <meshLambertMaterial color="#4a9152" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <ringGeometry args={[38, 44, 40]} />
        <meshLambertMaterial color="#a34a28" />
      </mesh>
    </group>
  )
}

function Landmarks() {
  return (
    <group>
      {/* Brabourne Stadium's low pale-green oval to the south */}
      <group position={[90, 0, 430]}>
        <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
          <circleGeometry args={[55, 40]} />
          <meshLambertMaterial color="#5aa262" />
        </mesh>
        <mesh position-y={4}>
          <torusGeometry args={[58, 4, 8, 40]} />
          <meshLambertMaterial color="#cfc6ae" />
        </mesh>
      </group>
      {/* Rajabai Clock Tower — 85 m buff Gothic spire to the south-east */}
      <group position={[300, 0, 330]}>
        <mesh position-y={32}>
          <boxGeometry args={[14, 64, 14]} />
          <meshLambertMaterial color="#c9b088" />
        </mesh>
        <mesh position-y={72}>
          <coneGeometry args={[9, 18, 4]} />
          <meshLambertMaterial color="#b09468" />
        </mesh>
      </group>
      {/* gymkhana maidans strung north along Marine Drive */}
      {[[-170, -220], [-155, -320], [-140, -420]].map(([x, z], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.02, z]}>
          <planeGeometry args={[75, 60]} />
          <meshLambertMaterial color={i % 2 ? '#3e7d46' : '#4a9152'} />
        </mesh>
      ))}
    </group>
  )
}

export default function CityScape() {
  return (
    <group>
      <SunsetSky />
      <Sea />
      <MarineDrive />
      <Buildings />
      <Railway />
      <Cars />
      <UniversityGround />
      <Landmarks />
    </group>
  )
}
