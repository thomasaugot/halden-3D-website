// Tiny pub-sub shared by the canvases and the React overlay.

type Listener<T> = (value: T) => void

export class Signal<T> {
  private listeners = new Set<Listener<T>>()
  private current: T

  constructor(initial: T) {
    this.current = initial
  }

  get value(): T {
    return this.current
  }

  set(next: T): void {
    if (Object.is(next, this.current)) return
    this.current = next
    this.listeners.forEach((fn) => fn(next))
  }

  subscribe(fn: Listener<T>): () => void {
    this.listeners.add(fn)
    fn(this.current)
    return () => this.listeners.delete(fn)
  }
}

export const PHASES = ['Cruise', 'Climb', 'Descent', 'Landed'] as const

export interface Instrument {
  /** metres */
  alt: number
  phase: number
}

/** 0 to 1 while the opening film loads. */
export const loadProgress = new Signal(0)
/** True once the opening frames are decoded and the page can be shown. */
export const sceneReady = new Signal(false)
/** Index of the route the globe is pointing at. */
export const activeRoute = new Signal(0)
/** What the altimeter shows. Written by whichever section is on screen. */
export const instrument = new Signal<Instrument>({ alt: 12500, phase: 0 })
