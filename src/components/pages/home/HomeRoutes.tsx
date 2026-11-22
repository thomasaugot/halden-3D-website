import { useEffect, useRef } from 'react'
import { SplitFlap } from '@/components/ui/SplitFlap'
import { HOME, ROUTES } from '@/constants/routes'
import { useActiveRoute } from '@/hooks/useActiveRoute'
import { GlobeScene } from '@/lib/webgl/globe-scene'
import { globeScrub } from '@/utils/animations/globe-scrub'
import { numberFormat } from '@/utils/format'
import { logger } from '@/utils/logger'

export function HomeRoutes() {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const i = useActiveRoute()

  useEffect(() => {
    const el = section.current
    const cv = canvas.current
    if (!el || !cv) return
    const scene = new GlobeScene(cv)
    scene.load().catch((e) => logger.error('globe failed to load', e))
    const stop = globeScrub(el, scene, ROUTES.length)
    return () => {
      stop()
      scene.dispose()
    }
  }, [])

  const r = ROUTES[i]

  return (
    <section id="routes" ref={section} className="relative h-[520svh]" aria-labelledby="routes-title">
      <div className="sticky top-0 h-svh overflow-hidden">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden="true" />

        <div className="absolute inset-x-4 top-24 md:inset-x-10 wide:inset-x-auto wide:top-1/2 wide:left-10 wide:w-[min(30rem,38vw)] wide:-translate-y-1/2">
          <h2 id="routes-title" className="max-w-[16ch] font-wide text-display">
            Fly anywhere from Geneva
          </h2>
          <p className="mt-4 max-w-[34ch] text-lede text-fg-2">Every city on this board is nonstop from Geneva, Tokyo included.</p>

          <div className="mt-10 md:mt-14" aria-live="polite">
            <div className="flex items-center gap-3 text-title">
              <SplitFlap text={HOME.code} length={3} />
              <span className="text-body text-fg-2" aria-hidden="true">
                to
              </span>
              <SplitFlap text={r.to.code} length={3} />
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-6 font-mono">
              <div>
                <dt className="text-micro text-fg-2">Distance</dt>
                <dd className="mt-1 text-body">{numberFormat.format(r.km)} km</dd>
              </div>
              <div>
                <dt className="text-micro text-fg-2">Flight time</dt>
                <dd className="mt-1 text-body">{r.time}</dd>
              </div>
              <div>
                <dt className="text-micro text-fg-2">Stops</dt>
                <dd className="mt-1 text-body">None</dd>
              </div>
            </dl>
          </div>

          <ol className="mt-10 hidden wide:block" aria-label="Destinations">
            {ROUTES.map((route, k) => (
              <li
                key={route.to.code}
                className={`flex items-baseline justify-between py-1.5 text-body transition-colors duration-500 ${k === i ? 'text-fg' : 'text-fg-2/60'}`}
              >
                <span>{route.to.city}</span>
                <span className="font-mono text-small">{route.time}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
