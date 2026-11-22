import { Signal } from '@/lib/signal'
import type { Instrument } from '@/types/flight'

/** 0 to 1 while the opening film loads. */
export const loadProgress = new Signal(0)
/** True once the opening frames are decoded and the page can be shown. */
export const sceneReady = new Signal(false)
/** Index of the route the globe is pointing at. */
export const activeRoute = new Signal(0)
/** What the altimeter shows. Written by whichever section is on screen. */
export const instrument = new Signal<Instrument>({ alt: 12500, phase: 0 })
