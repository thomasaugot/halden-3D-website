import { gsap } from '@/lib/gsap'
import { reducedMotion } from '@/lib/lenis'

/** Lifts the loader's lines, then wipes the whole overlay upward. Calls `done` when it is gone. */
export function loaderExit(root: HTMLElement, done: () => void): void {
  if (reducedMotion()) {
    gsap.to(root, { autoAlpha: 0, duration: 0.3, onComplete: done })
    return
  }
  gsap
    .timeline({ delay: 0.35, onComplete: done })
    .to(root.querySelectorAll('[data-lift]'), { yPercent: -110, duration: 0.7, ease: 'power3.in', stagger: 0.06 })
    .to(root, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.25')
}
