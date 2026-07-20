// Capture the current 3D view (requires preserveDrawingBuffer on the canvas),
// stamp a seat-info banner on it, then Web-Share it or download a PNG.
export async function shareSnapshot(info) {
  const src = document.querySelector('canvas')
  if (!src) return
  const w = src.width
  const h = src.height
  const bh = Math.max(64, Math.round(h * 0.09))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h + bh
  const g = c.getContext('2d')
  g.drawImage(src, 0, 0)

  // banner
  g.fillStyle = '#004ba0'
  g.fillRect(0, h, w, bh)
  g.fillStyle = '#ffd93d'
  g.fillRect(0, h, w, Math.max(3, Math.round(bh * 0.06)))
  const pad = Math.round(bh * 0.35)
  g.textBaseline = 'middle'
  g.fillStyle = '#ffffff'
  g.font = `bold ${Math.round(bh * 0.38)}px Rajdhani, "Segoe UI", Arial`
  g.fillText(info.title, pad, h + bh * 0.55)
  g.textAlign = 'right'
  g.fillStyle = '#ffd93d'
  g.fillText(info.price, w - pad, h + bh * 0.55)
  g.textAlign = 'left'

  const blob = await new Promise(res => c.toBlob(res, 'image/png'))
  if (!blob) return
  const file = new File([blob], 'wankhede-seat-view.png', { type: 'image/png' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'My Wankhede seat view',
        text: `${info.title} · ${info.price} — IPL 2026 MI vs RCB`,
      })
      return
    } catch (e) {
      if (e && e.name === 'AbortError') return // user closed the share sheet
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'wankhede-seat-view.png'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
