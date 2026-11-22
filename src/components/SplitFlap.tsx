import { useEffect, useRef, useState } from 'react'
import { reducedMotion } from '../lib/lenis'

const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

interface Props {
  text: string
  length: number
  className?: string
}

/** A departure-board row: each tile flips through the alphabet until it lands on its letter. */
export function SplitFlap({ text, length, className = '' }: Props) {
  const target = text.toUpperCase().padEnd(length, ' ').slice(0, length)
  const [shown, setShown] = useState(target)
  const frame = useRef<number | null>(null)
  const shownRef = useRef(target)

  useEffect(() => {
    if (reducedMotion()) return
    const start = performance.now()
    const from = shownRef.current.padEnd(length, ' ')
    const tick = (now: number) => {
      const elapsed = now - start
      let done = true
      const next = Array.from(target, (ch, i) => {
        if (elapsed >= 280 + i * 70) return ch
        done = false
        const k = Math.floor(elapsed / 50) + i * 3
        return CHARS[(CHARS.indexOf(from[i]) + k + 1) % CHARS.length]
      }).join('')
      shownRef.current = next
      setShown(next)
      if (!done) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [target, length])

  return (
    <span className={`inline-flex gap-1 ${className}`} aria-label={text}>
      {Array.from(reducedMotion() ? target : shown, (ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="relative grid h-[1.75em] w-[1.3em] place-items-center overflow-hidden rounded-md bg-panel font-mono text-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_2px_rgb(0_0_0/0.4)]"
        >
          {ch}
          <span className="absolute inset-x-0 top-1/2 h-px bg-ground/80" />
        </span>
      ))}
    </span>
  )
}
