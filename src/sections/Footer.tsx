import { useEffect, useRef } from 'react'
import { ScrollTrigger } from '../lib/gsap'
import { FrameSequence, sequenceUrls } from '../lib/FrameSequence'
import { Mark } from '../components/Mark'
import { instrument } from '../scene/store'
import { getSequenceManifest } from '../services/sequences'

/** The page lands: the final clip comes down over the lake and touches down in front of the Alps. */
export function Footer() {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const fade = useRef<HTMLDivElement>(null)
  const sign = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = section.current
    const cv = canvas.current
    if (!el || !cv) return
    let seq: FrameSequence | null = null
    let st: ScrollTrigger | null = null
    let alive = true

    getSequenceManifest().then((m) => {
      if (!alive) return
      seq = new FrameSequence(cv, sequenceUrls(m, ['c6-landing']).urls, { focusX: 0.45 })
      // load once the reader is getting close, not on first paint
      ScrollTrigger.create({ trigger: el, start: 'top 300%', once: true, onEnter: () => seq?.load() })
      st = ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom bottom',
        onUpdate: ({ progress: p }) => {
          seq?.seek(Math.min(1, Math.max(0, (p - 0.08) / 0.78)))
          if (fade.current) fade.current.style.opacity = String(1 - Math.min(1, p / 0.12))
          if (sign.current) sign.current.dataset.on = String(p > 0.84)
          const alt = Math.max(0, 1500 * (1 - (p - 0.1) / 0.66))
          instrument.set({ alt: p < 0.1 ? 1500 : alt, phase: p > 0.8 ? 3 : 2 })
        },
      })
    })
    return () => {
      alive = false
      st?.kill()
      seq?.dispose()
    }
  }, [])

  return (
    <footer id="landing" ref={section} className="relative h-[300svh]">
      <div className="sticky top-0 h-svh overflow-hidden bg-stratos text-contrail">
        <canvas
          ref={canvas}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="The H7 descends over the lake and lands in Geneva at dusk, the Alps behind the runway"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stratos/80 to-transparent" />
        <div ref={fade} className="pointer-events-none absolute inset-0 bg-ground" />

        <div ref={sign} data-on="false" className="beat absolute inset-x-0 bottom-0 px-4 pb-8 md:px-10 md:pb-10">
          <div className="flex items-center gap-4">
            <Mark className="size-10 md:size-12" />
            <p className="font-wide text-display">Halden</p>
          </div>
          <div className="mt-10 grid gap-8 text-small text-contrail/75 md:grid-cols-12">
            <address className="not-italic md:col-span-4">
              Halden private aviation
              <br />
              Geneva, Switzerland
            </address>
            <a href="mailto:fly@halden.example" className="font-mono text-contrail md:col-span-3">
              fly@halden.example
            </a>
            <nav aria-label="Footer" className="flex gap-6 md:col-span-3">
              <a href="#careers" className="transition-colors hover:text-contrail">
                Careers
              </a>
              <a href="#press" className="transition-colors hover:text-contrail">
                Press
              </a>
              <a href="#privacy" className="transition-colors hover:text-contrail">
                Privacy
              </a>
            </nav>
          </div>
          <p className="mt-10 max-w-[70ch] text-micro text-contrail/55">
            Concept project by Thomas Augot. Halden is a fictional company: aircraft, prices and services are invented.
            Footage and photography generated with Gemini.
          </p>
        </div>
      </div>
    </footer>
  )
}
