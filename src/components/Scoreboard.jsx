import React, { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { FIELD_RZ } from '../data/stadium.js'
import { ringPoint } from './Roof.jsx'

// Old-school analog cricket scoreboard: black board, flip-digit tiles,
// amber/white lettering. The score actually ticks — it listens to the match
// loop's boundary events and adds the runs.
const W = 1024
const H = 640

function drawTile(g, x, y, w, h, text, color = '#ffd93d') {
  g.fillStyle = '#0c0c0f'
  g.beginPath()
  g.roundRect(x, y, w, h, 6)
  g.fill()
  g.strokeStyle = '#2c2c33'
  g.lineWidth = 2
  g.stroke()
  // flip-board split line
  g.strokeStyle = 'rgba(255,255,255,0.08)'
  g.beginPath()
  g.moveTo(x + 2, y + h / 2)
  g.lineTo(x + w - 2, y + h / 2)
  g.stroke()
  g.fillStyle = color
  g.font = `bold ${Math.floor(h * 0.62)}px "Rajdhani", "Arial Narrow", sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, x + w / 2, y + h / 2 + 2)
}

function drawTileRow(g, cx, y, chars, tileW, tileH, gap, color) {
  const total = chars.length * tileW + (chars.length - 1) * gap
  let x = cx - total / 2
  for (const ch of chars) {
    drawTile(g, x, y, tileW, tileH, ch, color)
    x += tileW + gap
  }
}

function drawBoard(g, state) {
  // clean grid: labels in a left column (x=64), tile rows right-aligned to a
  // shared right margin (x=W-64), consistent row baselines
  const LEFT = 64
  const RIGHT = W - 64
  const rightAlignedTiles = (y, chars, tileW, tileH, gap, color) => {
    const total = chars.length * tileW + (chars.length - 1) * gap
    drawTileRow(g, RIGHT - total / 2, y, chars, tileW, tileH, gap, color)
  }

  // board background
  g.fillStyle = '#101014'
  g.fillRect(0, 0, W, H)
  g.strokeStyle = '#3a3a42'
  g.lineWidth = 10
  g.strokeRect(5, 5, W - 10, H - 10)

  // header
  g.fillStyle = '#f4f6fb'
  g.font = 'bold 52px "Rajdhani", "Arial Narrow", sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('WANKHEDE STADIUM', W / 2, 64)
  g.fillStyle = '#2b7fff'
  g.fillRect(W / 2 - 260, 96, 520, 4)

  // row 1: batting side + score tiles (row centreline y=180)
  g.fillStyle = '#9fb4d8'
  g.font = 'bold 40px "Rajdhani", "Arial Narrow", sans-serif'
  g.textAlign = 'left'
  g.fillText('MUMBAI INDIANS', LEFT, 180)
  rightAlignedTiles(138, [...`${state.runs}`, '-', `${state.wkts}`], 72, 84, 8, '#ffd93d')

  // row 2: overs (row centreline y=300)
  g.fillStyle = '#9fb4d8'
  g.textAlign = 'left'
  g.fillText('OVERS', LEFT, 300)
  rightAlignedTiles(262, [...`${state.overs}.${state.balls}`], 62, 76, 8, '#ffffff')

  // row 3: bowling side (row centreline y=412)
  g.fillStyle = '#9fb4d8'
  g.textAlign = 'left'
  g.fillText('ROYAL CHALLENGERS BENGALURU', LEFT, 412)
  g.fillStyle = '#ff5252'
  g.font = 'bold 40px "Rajdhani", "Arial Narrow", sans-serif'
  g.textAlign = 'right'
  g.fillText('BOWLING', RIGHT, 412)

  // footer strip
  g.fillStyle = '#1a63e8'
  g.fillRect(24, 484, W - 48, 108)
  g.fillStyle = '#ffffff'
  g.font = 'bold 56px "Rajdhani", "Arial Narrow", sans-serif'
  g.textAlign = 'center'
  g.fillText('TATA IPL 2026 · MI vs RCB', W / 2, 538)
}

export default function Scoreboard() {
  const state = useRef({ runs: 147, wkts: 4, overs: 16, balls: 2 })

  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const tex = new THREE.CanvasTexture(canvas)
    tex.anisotropy = 4
    drawBoard(canvas.getContext('2d'), state.current)
    tex.needsUpdate = true
    return { canvas, tex }
  }, [])

  useEffect(() => {
    const onBoundary = e => {
      const s = state.current
      s.runs += e.detail && e.detail.six ? 6 : 4
      s.balls += 1
      if (s.balls > 5) { s.balls = 0; s.overs += 1 }
      if (s.overs >= 20) { s.runs = 12; s.wkts = 0; s.overs = 1; s.balls = 3 }
      drawBoard(canvas.getContext('2d'), s)
      tex.needsUpdate = true
    }
    window.addEventListener('wankhede-boundary', onBoundary)
    return () => window.removeEventListener('wankhede-boundary', onBoundary)
  }, [canvas, tex])

  const pos = useMemo(() => ringPoint(0, 26, 0), [])
  return (
    <group>
      {/* giant analog board above the North Stand, propped on a frame */}
      <group position={[pos.x, 15, pos.z]}>
        <mesh>
          <boxGeometry args={[21, 12.5, 0.9]} />
          <meshLambertMaterial color="#131318" />
        </mesh>
        <mesh position={[0, 0, 0.5]}>
          <planeGeometry args={[19.6, 11.8]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
        {/* support legs down to the stand */}
        {[-8, 8].map(x => (
          <mesh key={x} position={[x, -8.5, -0.2]}>
            <cylinderGeometry args={[0.35, 0.45, 6, 8]} />
            <meshLambertMaterial color="#3a4152" />
          </mesh>
        ))}
      </group>
      {/* sight screens at both ends */}
      {[+1, -1].map(end => (
        <mesh key={end} position={[0, 3, end * (FIELD_RZ + 2.5)]}>
          <boxGeometry args={[15, 6, 0.5]} />
          <meshLambertMaterial color="#111318" />
        </mesh>
      ))}
    </group>
  )
}
