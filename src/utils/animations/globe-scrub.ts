import { ScrollTrigger } from '@/lib/gsap'
import type { GlobeScene } from '@/lib/webgl/globe-scene'
import { instrument } from '@/stores/flight'

/** Turns the globe from one route to the next as the section scrolls. */
export function globeScrub(section: HTMLElement, scene: GlobeScene, routeCount: number): () => void {
  const n = routeCount
  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress
      // the globe rises in while the section arrives, then turns from one route to the next
      const presence = Math.min(1, Math.max(0, (p - 0.12) / 0.14))
      const focus = -1 + n * Math.min(1, Math.max(0, (p - 0.24) / 0.7))
      scene.set(presence, Math.min(n - 1, focus))
      if (self.isActive) {
        instrument.set({ alt: 15500, phase: 0 })
        document.documentElement.dataset.sky = 'night'
      }
    },
  })
  return () => st.kill()
}
