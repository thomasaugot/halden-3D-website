import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'
import { reducedMotion } from '../lib/lenis'
import { loadProgress, sceneReady } from '../scene/store'

/** Holds the page until the aircraft and the globe are on the GPU. Progress is real, from the asset downloads. */
export function Loader() {
  const root = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    const offProgress = loadProgress.subscribe((p) => {
      if (bar.current) gsap.to(bar.current, { scaleX: p, duration: 0.5, ease: 'power2.out', overwrite: true })
    })
    const offReady = sceneReady.subscribe((ready) => {
      if (!ready || !root.current) return
      const done = () => {
        document.documentElement.style.overflow = ''
        setGone(true)
      }
      if (reducedMotion()) {
        gsap.to(root.current, { autoAlpha: 0, duration: 0.3, onComplete: done })
        return
      }
      gsap
        .timeline({ delay: 0.35, onComplete: done })
        .to(root.current.querySelectorAll('[data-lift]'), { yPercent: -110, duration: 0.7, ease: 'power3.in', stagger: 0.06 })
        .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.25')
    })
    return () => {
      offProgress()
      offReady()
      document.documentElement.style.overflow = ''
    }
  }, [])

  if (gone) return null

  return (
    <div
      ref={root}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-stratos p-4 text-contrail [clip-path:inset(0_0_0_0)] md:p-8"
      role="status"
      aria-label="Loading"
    >
      <div className="overflow-hidden">
        <p data-lift className="font-wide text-display-xl">
          Halden
        </p>
      </div>
      <div className="mt-6 flex items-center gap-4 overflow-hidden md:mt-8">
        <p data-lift className="shrink-0 font-mono text-micro text-mist">
          Preparing your aircraft
        </p>
        <div className="h-px flex-1 bg-mist/25">
          <div ref={bar} className="h-full origin-left scale-x-0 bg-cobalt-hi" />
        </div>
      </div>
    </div>
  )
}
