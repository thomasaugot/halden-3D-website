import { useEffect, useRef } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import { FilmCaption } from '@/components/ui/FilmCaption'
import { SPECS } from '@/constants/aircraft'
import { BEATS, CLIPS, SVH_PER_SECOND } from '@/constants/film'
import { usePortrait } from '@/hooks/usePortrait'
import { useSequenceSet } from '@/hooks/useSequenceSet'
import { FrameSequence } from '@/lib/frame-sequence'
import { scrollToId } from '@/lib/lenis'
import { loadProgress, sceneReady } from '@/stores/flight'
import { filmScrub } from '@/utils/animations/film-scrub'
import { beatRanges, clipSpan, filmHeightSvh, sequenceUrls } from '@/utils/film'

export function HomeFilm() {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const beatRefs = useRef<(HTMLDivElement | null)[]>([])
  const anchorRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const portrait = usePortrait()
  // tall screens get the 9:16 cut; rotating the device swaps the cut in place
  const set = useSequenceSet(portrait ? 'portrait' : 'landscape')

  useEffect(() => {
    const el = section.current
    const cv = canvas.current
    if (!set || !el || !cv) return
    const { manifest, base } = set

    const { urls, bounds } = sequenceUrls(manifest, [...CLIPS], base)
    el.style.height = `${filmHeightSvh(manifest, CLIPS, SVH_PER_SECOND)}svh`
    const ranges = beatRanges(BEATS, CLIPS, bounds)

    const seq = new FrameSequence(cv, urls, { fit: portrait && base === 'seq' ? 'frame' : 'cover' })
    const firstPass = Math.min(urls.length, Math.ceil(urls.length / 16) + 4)
    seq.onProgress = (loaded) => {
      loadProgress.set(Math.min(1, loaded / firstPass))
      if (loaded >= firstPass) sceneReady.set(true)
    }
    seq.load()

    // nav anchors sit where their chapter starts
    for (const [i, b] of BEATS.entries()) {
      const node = b.id ? anchorRefs.current[b.id] : null
      if (node) node.style.top = `${ranges[i][0] * 100}%`
    }

    const stop = filmScrub({ section: el, seq, beats: beatRefs, veil, ranges, climb: clipSpan(CLIPS, bounds, 'c5-climb') })
    return () => {
      stop()
      seq.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set])

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
            {b.kind === 'hero' && (
              <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="max-w-[14ch] font-wide text-display-xl text-contrail">{b.title}</h1>
                  <p className="mt-6 max-w-[36ch] text-lede text-contrail/80">{b.text}</p>
                </div>
                <a
                  href="#book"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToId('book')
                  }}
                  className="group inline-flex w-fit shrink-0 items-center gap-3 rounded-lg bg-contrail px-6 py-4 text-body font-medium text-stratos transition-[transform,background-color] duration-200 hover:bg-white active:scale-[0.98]"
                >
                  {b.cta}
                  <ArrowRight weight="regular" className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </a>
              </div>
            )}
            {b.kind === 'caption' && <FilmCaption title={b.title} text={b.text} meta={b.meta} />}
            {b.kind === 'specs' && (
              <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
                <FilmCaption title={b.title} text={b.text} meta={b.meta} />
                <dl className="grid grid-cols-3 gap-6 md:gap-12">
                  {SPECS.map((s) => (
                    <div key={s.value}>
                      <dt className="font-mono text-micro text-contrail/65">{s.label}</dt>
                      <dd className="mt-2 font-wide text-title whitespace-nowrap text-contrail">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        ))}
        <div ref={veil} className="pointer-events-none absolute inset-0 bg-ground opacity-0" />
      </div>
    </section>
  )
}
