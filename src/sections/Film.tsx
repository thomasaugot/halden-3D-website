import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import { ScrollTrigger } from '../lib/gsap'
import { FrameSequence, sequenceUrls, type SequenceManifest } from '../lib/FrameSequence'
import { scrollToId } from '../lib/lenis'
import { instrument, loadProgress, sceneReady } from '../scene/store'
import { getSequenceManifest } from '../services/sequences'

const CLIPS = ['c1-cabin', 'c2-flyby', 'c3-orbit', 'c4-inside', 'c5-climb'] as const
type Clip = (typeof CLIPS)[number]

/** Scroll length per second of footage. */
const SVH_PER_SECOND = 62

interface Beat {
  clip: Clip
  from: number
  to: number
  id?: string
  node: React.ReactNode
  /** where the copy sits */
  place: string
}

const SPECS = [
  { value: '13,000 km', label: 'Range, Geneva to Tokyo nonstop' },
  { value: '15,500 m', label: 'Ceiling, above the airlines' },
  { value: '19 seats', label: 'Or ten beds made up overnight' },
]

function Caption({ title, text, meta }: { title: string; text: string; meta?: string }) {
  return (
    <>
      {meta && <p className="mb-3 font-mono text-micro text-contrail/70">{meta}</p>}
      <h2 className="font-wide text-display text-contrail">{title}</h2>
      <p className="mt-4 max-w-[38ch] text-lede text-contrail/80">{text}</p>
    </>
  )
}

const BEATS: Beat[] = [
  {
    clip: 'c1-cabin',
    from: 0,
    to: 0.3,
    place: 'bottom-0 left-0 right-0 px-4 pb-10 md:px-10 md:pb-14',
    node: (
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="max-w-[14ch] font-wide text-display-xl text-contrail">Private jets from Geneva</h1>
          <p className="mt-6 max-w-[36ch] text-lede text-contrail/80">
            One aircraft, two captains, a flight plan filed the moment you call. Wheels up three hours later.
          </p>
        </div>
        <a
          href="#book"
          onClick={(e) => {
            e.preventDefault()
            scrollToId('book')
          }}
          className="group inline-flex w-fit shrink-0 items-center gap-3 rounded-lg bg-contrail px-6 py-4 text-body font-medium text-stratos transition-[transform,background-color] duration-200 hover:bg-white active:scale-[0.98]"
        >
          Request a flight
          <ArrowRight weight="regular" className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </a>
      </div>
    ),
  },
  {
    clip: 'c1-cabin',
    from: 0.55,
    to: 0.98,
    place: 'bottom-0 left-0 px-4 pb-10 md:px-10 md:pb-14',
    node: <Caption title="Your cabin, your hour" text="Nobody else boards. The aircraft waits for you, not the other way round." />,
  },
  {
    clip: 'c2-flyby',
    from: 0.4,
    to: 1,
    place: 'bottom-0 left-0 px-4 pb-10 md:px-10 md:pb-14',
    node: <Caption meta="Halden H7" title="Leave when you are ready" text="A slot at Geneva within three hours, any day of the year, any hour of the night." />,
  },
  {
    clip: 'c3-orbit',
    from: 0.1,
    to: 0.92,
    id: 'aircraft',
    place: 'bottom-0 left-0 right-0 px-4 pb-10 md:px-10 md:pb-14',
    node: (
      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <Caption title="One aircraft type" text="Every Halden flight is an H7. Same cabin, same crew procedures, nothing to learn twice." />
        <dl className="grid grid-cols-3 gap-6 md:gap-12">
          {SPECS.map((s) => (
            <div key={s.value}>
              <dt className="font-mono text-micro text-contrail/65">{s.label}</dt>
              <dd className="mt-2 font-wide text-title text-contrail">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    ),
  },
  {
    clip: 'c4-inside',
    from: 0.06,
    to: 0.34,
    id: 'cabin',
    place: 'bottom-0 left-0 px-4 pb-10 md:px-10 md:pb-14',
    node: <Caption meta="Forward cabin" title="Club suite" text="Four seats face to face. They swivel, recline flat and sit beside the largest windows in the class." />,
  },
  {
    clip: 'c4-inside',
    from: 0.4,
    to: 0.66,
    place: 'bottom-0 left-0 px-4 pb-10 md:px-10 md:pb-14',
    node: <Caption meta="Mid cabin" title="Dining" text="The galley cooks to order. Tell us what you eat and it is aboard before you are." />,
  },
  {
    clip: 'c4-inside',
    from: 0.72,
    to: 1,
    place: 'bottom-0 left-0 px-4 pb-10 md:px-10 md:pb-14',
    node: <Caption meta="Aft cabin" title="Stateroom" text="A double bed, a shower and a door that closes, eleven hours from Tokyo." />,
  },
  {
    clip: 'c5-climb',
    from: 0.35,
    to: 1,
    place: 'bottom-0 left-0 px-4 pb-10 md:px-10 md:pb-14',
    node: <Caption title="Above the weather by minute twenty" text="The H7 cruises at 15,500 m, three kilometres over the airlines, where the air is still and the sky turns dark." />,
  },
]

export function Film() {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const beatRefs = useRef<(HTMLDivElement | null)[]>([])
  const anchorRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [manifest, setManifest] = useState<SequenceManifest | null>(null)

  useEffect(() => {
    let alive = true
    getSequenceManifest()
      .then((m) => alive && setManifest(m))
      .catch(() => sceneReady.set(true))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const el = section.current
    const cv = canvas.current
    if (!manifest || !el || !cv) return

    const { urls, bounds } = sequenceUrls(manifest, [...CLIPS])
    const seconds = CLIPS.reduce((s, c) => s + (manifest[c]?.frames ?? 0) / (manifest[c]?.fps ?? 15), 0)
    el.style.height = `${Math.round(seconds * SVH_PER_SECOND + 100)}svh`

    const span = (clip: Clip) => {
      const i = CLIPS.indexOf(clip)
      return [bounds[i], bounds[i + 1]] as const
    }
    const at = (clip: Clip, local: number) => {
      const [a, b] = span(clip)
      return a + (b - a) * local
    }
    const ranges = BEATS.map((b) => [at(b.clip, b.from), at(b.clip, b.to)] as const)

    const seq = new FrameSequence(cv, urls)
    const firstPass = Math.min(urls.length, Math.ceil(urls.length / 16) + 4)
    seq.onProgress = (loaded) => {
      loadProgress.set(Math.min(1, loaded / firstPass))
      if (loaded >= firstPass) sceneReady.set(true)
    }
    seq.load()

    const [climbA, climbB] = span('c5-climb')

    const apply = (p: number, active: boolean) => {
      seq.seek(p)
      ranges.forEach(([a, b], i) => {
        const node = beatRefs.current[i]
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

    // nav anchors sit where their chapter starts
    for (const [i, b] of BEATS.entries()) {
      const node = b.id ? anchorRefs.current[b.id] : null
      if (node) node.style.top = `${ranges[i][0] * 100}%`
    }

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => apply(self.progress, self.isActive),
      onRefresh: (self) => apply(self.progress, self.isActive),
    })
    ScrollTrigger.refresh()
    seq.seek(st.progress, true)
    return () => {
      st.kill()
      seq.dispose()
    }
  }, [manifest])

  return (
    <section id="hero" ref={section} className="relative h-[3000svh]" aria-label="The flight">
      {BEATS.filter((b) => b.id).map((b) => (
        <div
          key={b.id}
          id={b.id}
          ref={(n) => {
            anchorRefs.current[b.id!] = n
          }}
          className="absolute left-0 h-px w-px"
          aria-hidden="true"
        />
      ))}
      <div className="sticky top-0 h-svh overflow-hidden bg-stratos">
        <canvas
          ref={canvas}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="One continuous flight: down the cabin, out of the window, alongside the H7, back inside through the club suite, dining room and stateroom, then the climb into the dark"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-stratos/75 via-stratos/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-stratos/35 to-transparent" />
        {BEATS.map((b, i) => (
          <div
            key={i}
            ref={(n) => {
              beatRefs.current[i] = n
            }}
            className={`beat absolute ${b.place}`}
          >
            {b.node}
          </div>
        ))}
        <div ref={veil} className="pointer-events-none absolute inset-0 bg-ground opacity-0" />
      </div>
    </section>
  )
}
