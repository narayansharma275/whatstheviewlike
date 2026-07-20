// Procedural stadium crowd noise via WebAudio — no audio files needed.
// A looped filtered-noise bed (the continuous wall of crowd sound) with a
// slow swell LFO, plus cheer bursts triggered when the batter finds the
// boundary (via the 'wankhede-boundary' window event).
class CrowdAudio {
  constructor() {
    this.ctx = null
    this.master = null
    this.bedGain = null
    this.muted = false
    this.scene = 'overview' // 'overview' | 'seat'
    this._onBoundary = e => this.cheer(e.detail && e.detail.six)
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 1
    this.master.connect(this.ctx.destination)

    // ── crowd bed: white noise → bandpass → lowpass → gain
    const len = this.ctx.sampleRate * 2
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) {
      // pink-ish noise: integrate white noise slightly
      const white = Math.random() * 2 - 1
      last = last * 0.97 + white * 0.03
      data[i] = last * 6 + white * 0.12
    }
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    src.loop = true

    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 620
    bp.Q.value = 0.55

    const lp = this.ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 2600

    this.bedGain = this.ctx.createGain()
    this.bedGain.gain.value = 0.22

    // slow swell so the crowd "breathes"
    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 0.09
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.value = 0.05
    lfo.connect(lfoGain)
    lfoGain.connect(this.bedGain.gain)
    lfo.start()

    src.connect(bp)
    bp.connect(lp)
    lp.connect(this.bedGain)
    this.bedGain.connect(this.master)
    src.start()

    window.addEventListener('wankhede-boundary', this._onBoundary)
    this.applyScene()
  }

  applyScene() {
    if (!this.bedGain) return
    const target = this.scene === 'seat' ? 0.5 : 0.16
    this.bedGain.gain.cancelScheduledValues(this.ctx.currentTime)
    this.bedGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.8)
  }

  setScene(scene) {
    this.scene = scene
    if (this.ctx) this.applyScene()
  }

  setMuted(m) {
    this.muted = m
    if (this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime)
      this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.15)
    }
  }

  // small UI sounds for the game-menu feel; only play once audio is unlocked
  uiHover() {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return
    const now = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = 720
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.03, now)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07)
    o.connect(g)
    g.connect(this.master)
    o.start(now)
    o.stop(now + 0.08)
  }

  uiSelect() {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return
    const now = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.setValueAtTime(520, now)
    o.frequency.exponentialRampToValueAtTime(340, now + 0.12)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.06, now)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)
    o.connect(g)
    g.connect(this.master)
    o.start(now)
    o.stop(now + 0.15)
  }

  cheer(six) {
    if (!this.ctx || this.muted) return
    const now = this.ctx.currentTime
    const dur = six ? 3.2 : 2.2
    const len = Math.floor(this.ctx.sampleRate * dur)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    const src = this.ctx.createBufferSource()
    src.buffer = buf

    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = six ? 1150 : 950
    bp.Q.value = 0.7

    const g = this.ctx.createGain()
    const peak = (this.scene === 'seat' ? 0.5 : 0.2) * (six ? 1.25 : 1)
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(peak, now + 0.35)
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur)

    src.connect(bp)
    bp.connect(g)
    g.connect(this.master)
    src.start(now)
    src.stop(now + dur)
  }
}

const crowd = new CrowdAudio()
export default crowd
