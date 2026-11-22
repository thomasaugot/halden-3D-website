import { useEffect, useRef } from 'react'
import { PHASES } from '@/constants/flight'
import { instrument } from '@/stores/flight'
import { numberFormat } from '@/utils/format'

/** The page's instrument: altitude climbs and falls with the scroll, like the flight it describes. */
export function Altimeter() {
  const root = useRef<HTMLElement>(null)
  const value = useRef<HTMLSpanElement>(null)
  const phase = useRef<HTMLSpanElement>(null)
  const tape = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let lastAlt = -1
    let lastPhase = -1
    return instrument.subscribe(({ alt, phase: ph }) => {
      const a = Math.round(alt / 10) * 10
      if (a !== lastAlt) {
        lastAlt = a
        if (value.current) value.current.textContent = numberFormat.format(a)
        if (tape.current) tape.current.style.transform = `scaleY(${a / 15500})`
      }
      if (ph !== lastPhase) {
        lastPhase = ph
        if (phase.current) phase.current.textContent = PHASES[ph] ?? ''
        if (root.current) root.current.dataset.late = String(ph >= 2)
      }
    })
  }, [])

  return (
    <aside
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed right-4 bottom-4 z-30 flex items-end gap-3 font-mono text-contrail mix-blend-difference transition-opacity duration-500 max-md:data-[late=true]:opacity-0 md:top-1/2 md:right-10 md:bottom-auto md:-translate-y-1/2 md:items-center"
    >
      <div className="text-right">
        <span ref={phase} className="block text-micro opacity-70">
          Cruise
        </span>
        <span className="block text-small tabular-nums md:text-body">
          <span ref={value}>12,500</span>
          <span className="opacity-70"> m</span>
        </span>
      </div>
      <div className="relative h-14 w-px bg-contrail/30 md:h-40">
        <div ref={tape} className="absolute inset-0 origin-bottom bg-contrail will-change-transform" />
      </div>
    </aside>
  )
}
