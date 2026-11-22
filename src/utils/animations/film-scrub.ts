import type { RefObject } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import type { FrameSequence } from '@/lib/frame-sequence'
import { instrument } from '@/stores/flight'

interface FilmScrub {
  section: HTMLElement
  seq: FrameSequence
  /** the text panels, in the order of `ranges` */
  beats: RefObject<(HTMLDivElement | null)[]>
  veil: RefObject<HTMLDivElement | null>
  /** each beat's start and end on the film's 0..1 timeline */
  ranges: (readonly [number, number])[]
  /** where the climb clip starts and ends on the same timeline */
  climb: readonly [number, number]
}

/** Drives the film from the scroll: frames, text panels, the final fade, and the instrument while climbing. */
export function filmScrub({ section, seq, beats, veil, ranges, climb }: FilmScrub): () => void {
  const [climbA, climbB] = climb

  const apply = (p: number, active: boolean) => {
    seq.seek(p)
    ranges.forEach(([a, b], i) => {
      const node = beats.current[i]
      if (!node) return
      const on = p >= a && p < b ? 'true' : 'false'
      if (node.dataset.on !== on) node.dataset.on = on
    })
    if (veil.current) veil.current.style.opacity = String(Math.max(0, (p - 0.965) / 0.035))
    if (!active) return
    // the climb: altimeter winds up, the page turns to night, the last frames fade into the ground
    const c = climbB > climbA ? Math.min(1, Math.max(0, (p - climbA) / (climbB - climbA))) : 0
    instrument.set({ alt: 12500 + 3000 * c * c * (3 - 2 * c), phase: c > 0.02 ? 1 : 0 })
    document.documentElement.dataset.sky = c > 0.55 ? 'night' : 'day'
  }

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => apply(self.progress, self.isActive),
    onRefresh: (self) => apply(self.progress, self.isActive),
  })
  ScrollTrigger.refresh()
  seq.seek(st.progress, true)
  return () => st.kill()
}
