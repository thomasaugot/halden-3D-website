/**
 * Plays a numbered JPEG sequence on a canvas from a 0..1 position.
 *
 * - The playhead eases toward the target, so a flick of the wheel becomes a
 *   glide instead of a jump.
 * - Neighbouring frames are blended by the fractional position, so 15 fps
 *   footage reads as continuous motion.
 * - Frames load coarse-to-fine (every 16th, then every 8th, ...), so the whole
 *   timeline is scrubbable early and sharpens as the rest arrives.
 */
export class FrameSequence {
  private images: (HTMLImageElement | null)[]
  private ready: boolean[]
  private ctx: CanvasRenderingContext2D
  private target = 0
  private current = 0
  private raf: number | null = null
  private visible = true
  private observer: IntersectionObserver
  private lastDrawn = -1
  private dpr = Math.min(window.devicePixelRatio || 1, 2)
  private loadedCount = 0
  private canvas: HTMLCanvasElement
  private urls: string[]
  private focusX: number
  private fit: 'cover' | 'frame'
  /** tiny copy of the frame, scaled up to make the soft fill around a framed shot */
  private haze = document.createElement('canvas')
  private hazeMid = document.createElement('canvas')
  onProgress?: (loaded: number, total: number) => void

  /**
   * fit 'cover' fills the screen and crops; 'frame' shows the whole shot edge to edge across the width,
   * with a soft, darkened blow-up of the same frame above and below (for widescreen footage on tall screens).
   */
  constructor(canvas: HTMLCanvasElement, urls: string[], options: { focusX?: number; fit?: 'cover' | 'frame' } = {}) {
    this.canvas = canvas
    this.urls = urls
    this.focusX = options.focusX ?? 0.5
    this.fit = options.fit ?? 'cover'
    this.haze.width = 32
    this.haze.height = 18
    this.hazeMid.width = 256
    this.hazeMid.height = 144
    this.images = urls.map(() => null)
    this.ready = urls.map(() => false)
    this.ctx = canvas.getContext('2d', { alpha: false })!
    this.observer = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      if (this.visible) this.loop()
    })
    this.observer.observe(canvas)
    window.addEventListener('resize', this.resize)
    this.resize()
  }

  /** Coarse-to-fine order: 0, 16, 32 ... then 8, 24 ... then 4, 12 ... down to every frame. */
  private order(): number[] {
    const n = this.urls.length
    const seen = new Set<number>()
    const out: number[] = []
    for (let step = 16; step >= 1; step /= 2) {
      for (let i = 0; i < n; i += step) {
        if (!seen.has(i)) {
          seen.add(i)
          out.push(i)
        }
      }
    }
    if (!seen.has(n - 1)) out.push(n - 1)
    return out
  }

  load(concurrency = 6): Promise<void> {
    const queue = this.order()
    return new Promise((resolve) => {
      let active = 0
      const next = () => {
        if (queue.length === 0 && active === 0) {
          resolve()
          return
        }
        while (active < concurrency && queue.length) {
          const i = queue.shift()!
          active++
          const img = new Image()
          img.decoding = 'async'
          img.src = this.urls[i]
          img
            .decode()
            .catch(() => undefined)
            .finally(() => {
              this.images[i] = img
              this.ready[i] = img.naturalWidth > 0
              this.loadedCount++
              this.onProgress?.(this.loadedCount, this.urls.length)
              // a frame near the playhead just arrived: repaint now, even if the playhead is idle
              if (Math.abs(i - this.current * (this.urls.length - 1)) < 17) {
                this.lastDrawn = -1
                this.draw()
              }
              active--
              next()
            })
        }
      }
      next()
    })
  }

  /** Where the scroll wants the film to be, 0..1. */
  seek(p: number, immediate = false): void {
    this.target = Math.min(1, Math.max(0, p))
    if (immediate) this.current = this.target
    this.loop()
  }

  private resize = () => {
    const r = this.canvas.getBoundingClientRect()
    this.canvas.width = Math.round(r.width * this.dpr)
    this.canvas.height = Math.round(r.height * this.dpr)
    this.lastDrawn = -1
    this.draw()
  }

  private nearest(i: number): HTMLImageElement | null {
    for (let d = 0; d < this.urls.length; d++) {
      if (this.ready[i - d]) return this.images[i - d]
      if (this.ready[i + d]) return this.images[i + d]
    }
    return null
  }

  private cover(img: HTMLImageElement, alpha: number) {
    const cw = this.canvas.width
    const ch = this.canvas.height
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
    const w = img.naturalWidth * s
    const h = img.naturalHeight * s
    this.ctx.globalAlpha = alpha
    this.ctx.drawImage(img, (cw - w) * this.focusX, (ch - h) / 2, w, h)
  }

  private framed(img: HTMLImageElement, alpha: number, withFill: boolean) {
    const cw = this.canvas.width
    const ch = this.canvas.height
    if (withFill) {
      // shrink to 32 px, then scale back up in two steps: each bilinear pass smooths the last,
      // so the result is a soft wash instead of visible blocks
      const hz = this.haze.getContext('2d')!
      hz.drawImage(img, 0, 0, this.haze.width, this.haze.height)
      const mid = this.hazeMid.getContext('2d')!
      mid.imageSmoothingQuality = 'high'
      mid.filter = 'blur(6px)'
      mid.drawImage(this.haze, -12, -8, this.hazeMid.width + 24, this.hazeMid.height + 16)
      mid.filter = 'none'
      const s = Math.max(cw / this.hazeMid.width, ch / this.hazeMid.height)
      this.ctx.globalAlpha = 1
      this.ctx.imageSmoothingQuality = 'high'
      this.ctx.drawImage(this.hazeMid, (cw - this.hazeMid.width * s) / 2, (ch - this.hazeMid.height * s) / 2, this.hazeMid.width * s, this.hazeMid.height * s)
      this.ctx.fillStyle = 'rgba(13, 20, 36, 0.45)'
      this.ctx.fillRect(0, 0, cw, ch)
    }
    const h = (cw * img.naturalHeight) / img.naturalWidth
    // sits a little above centre so captions have the lower part of the screen
    this.ctx.globalAlpha = alpha
    this.ctx.drawImage(img, 0, (ch - h) * 0.4, cw, h)
  }

  private draw() {
    const pos = this.current * (this.urls.length - 1)
    if (Math.abs(pos - this.lastDrawn) < 0.002) return
    this.lastDrawn = pos
    const i = Math.floor(pos)
    const f = pos - i
    const a = this.ready[i] ? this.images[i] : this.nearest(i)
    if (!a) return
    const b = this.ready[i + 1] ? this.images[i + 1] : null
    if (this.fit === 'frame') {
      this.framed(a, 1, true)
      if (b && f > 0.01) this.framed(b, f, false)
    } else {
      this.cover(a, 1)
      if (b && f > 0.01) this.cover(b, f)
    }
    this.ctx.globalAlpha = 1
  }

  private loop = () => {
    if (this.raf !== null || !this.visible) return
    const step = () => {
      this.raf = null
      const delta = this.target - this.current
      this.current += Math.abs(delta) < 0.00005 ? delta : delta * 0.14
      this.draw()
      if (this.current !== this.target && this.visible) this.raf = requestAnimationFrame(step)
    }
    this.raf = requestAnimationFrame(step)
  }

  dispose(): void {
    if (this.raf !== null) cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    window.removeEventListener('resize', this.resize)
  }
}
