import React, { useMemo } from 'react'
import * as THREE from 'three'
import { ringPoint } from './Roof.jsx'

// Four ~70 m polygonal floodlight masts at the diagonal corners of the bowl
// (Wankhede's actual arrangement), each throwing a real SpotLight onto the
// field plus a faint additive beam cone so the light itself reads at night.
const MAST_ANGLES = [45, 135, 225, 315]
const HEAD_Y = 55

function Mast({ angle }) {
  const base = useMemo(() => ringPoint(angle, 36, 0), [angle])
  const yaw = Math.atan2(-base.x, -base.z)

  const { headPos, target, coneQuat, coneMid, coneLen } = useMemo(() => {
    const inward = new THREE.Vector3(-base.x, 0, -base.z).normalize()
    const headPos = new THREE.Vector3(base.x, HEAD_Y, base.z).addScaledVector(inward, 2)
    const target = new THREE.Object3D()
    target.position.set(0, 0, 0)
    const aim = new THREE.Vector3(0, 1, 0).sub(headPos)
    const coneLen = aim.length()
    const dir = aim.clone().normalize()
    // cone geometry points down local -Y after flip; orient its axis onto dir
    const coneQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir)
    const coneMid = headPos.clone().addScaledVector(dir, coneLen / 2)
    return { headPos, target, coneQuat, coneMid, coneLen }
  }, [base])

  return (
    <group>
      {/* the actual light */}
      <spotLight
        position={headPos.toArray()}
        target={target}
        intensity={1.05}
        angle={Math.PI / 3.4}
        penumbra={0.6}
        decay={0}
        color="#e8f0ff"
      />
      <primitive object={target} />

      {/* faint visible beam */}
      <mesh position={coneMid.toArray()} quaternion={coneQuat}>
        <cylinderGeometry args={[2.5, 40, coneLen, 20, 1, true]} />
        <meshBasicMaterial
          color="#bcd4ff"
          transparent
          opacity={0.045}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* mast structure */}
      <group position={[base.x, 0, base.z]} rotation-y={yaw}>
        <mesh position={[0, 27, 0]}>
          <cylinderGeometry args={[0.7, 1.6, 54, 8]} />
          <meshLambertMaterial color="#9aa1b0" />
        </mesh>
        <group position={[0, HEAD_Y, 1.5]} rotation-x={0.42}>
          <mesh>
            <boxGeometry args={[11, 7, 0.8]} />
            <meshLambertMaterial color="#3a4152" />
          </mesh>
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 6 }).map((_, c) => (
              <mesh key={`${r}-${c}`} position={[-4.4 + c * 1.76, -2.4 + r * 1.6, 0.55]}>
                <circleGeometry args={[0.62, 12]} />
                <meshBasicMaterial color="#fffdf0" toneMapped={false} />
              </mesh>
            ))
          )}
          {/* halo glow behind the head */}
          <mesh position={[0, 0, 0.7]}>
            <planeGeometry args={[14, 9]} />
            <meshBasicMaterial
              color="#dbe9ff"
              transparent
              opacity={0.22}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>
    </group>
  )
}

export default function Floodlights() {
  return (
    <group>
      {MAST_ANGLES.map(a => <Mast key={a} angle={a} />)}
      {/* soft glow hovering over the pitch, like the reference project */}
      <pointLight position={[0, 22, 0]} intensity={0.4} distance={160} decay={2} color="#bcd8ff" />
    </group>
  )
}
