import { Fragment, useEffect, useRef } from 'react'
import { BrandMark } from '@/components/ui/BrandMark'
import { CONTACT_EMAIL, FOOTER_LINKS, LOCATION_LINES } from '@/constants/contact'
import { LANDING_CLIP } from '@/constants/film'
import { usePortrait } from '@/hooks/usePortrait'
import { useSequenceSet } from '@/hooks/useSequenceSet'
import { FrameSequence } from '@/lib/frame-sequence'
import { landingScrub } from '@/utils/animations/landing-scrub'
import { sequenceUrls } from '@/utils/film'

/** The page lands: the final clip comes down over the lake and touches down in front of the Alps. */
export function SiteFooter() {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const fade = useRef<HTMLDivElement>(null)
  const sign = useRef<HTMLDivElement>(null)
  const portrait = usePortrait()
  const set = useSequenceSet(portrait ? 'portrait' : 'landscape')

  useEffect(() => {
    const el = section.current
    const cv = canvas.current
    if (!set || !el || !cv) return
    const { manifest, base } = set
    const seq = new FrameSequence(cv, sequenceUrls(manifest, [LANDING_CLIP], base).urls, {
      focusX: portrait ? 0.5 : 0.45,
      fit: portrait && base === 'seq' ? 'frame' : 'cover',
    })
    const stop = landingScrub({ section: el, seq, fade, sign })
    return () => {
      stop()
      seq.dispose()
    }
    // the cut follows the set; rotating the device swaps it in place
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set])

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
            <BrandMark className="size-10 md:size-12" />
            <p className="font-wide text-display">Halden</p>
          </div>
          <div className="mt-10 grid gap-8 text-small text-contrail/75 md:grid-cols-12">
            <address className="not-italic md:col-span-4">
              {LOCATION_LINES.map((line, i) => (
                <Fragment key={line}>
                  {i > 0 && <br />}
                  {line}
                </Fragment>
              ))}
            </address>
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-mono text-contrail md:col-span-3">
              {CONTACT_EMAIL}
            </a>
            <nav aria-label="Footer" className="flex gap-6 md:col-span-3">
              {FOOTER_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="transition-colors hover:text-contrail">
                  {l.label}
                </a>
              ))}
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
