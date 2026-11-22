import type { RefObject } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import type { FrameSequence } from '@/lib/frame-sequence'
import { instrument } from '@/stores/flight'

interface LandingScrub {
  section: HTMLElement
  seq: FrameSequence
  fade: RefObject<HTMLDivElement | null>
  sign: RefObject<HTMLDivElement | null>
}

/** The landing: loads the clip as the reader nears it, plays it on scroll, then reveals the sign-off. */
export function landingScrub({ section, seq, fade, sign }: LandingScrub): () => void {
  // load once the reader is getting close, not on first paint
  const loader = ScrollTrigger.create({ trigger: section, start: 'top 300%', once: true, onEnter: () => seq.load() })
  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom bottom',
    onUpdate: ({ progress: p }) => {
      seq.seek(Math.min(1, Math.max(0, (p - 0.08) / 0.78)))
      if (fade.current) fade.current.style.opacity = String(1 - Math.min(1, p / 0.12))
      if (sign.current) sign.current.dataset.on = String(p > 0.84)
      const alt = Math.max(0, 1500 * (1 - (p - 0.1) / 0.66))
      instrument.set({ alt: p < 0.1 ? 1500 : alt, phase: p > 0.8 ? 3 : 2 })
    },
  })
  return () => {
    loader.kill()
    st.kill()
  }
}
