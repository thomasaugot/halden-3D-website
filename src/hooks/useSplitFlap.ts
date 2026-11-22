import { useEffect, useRef, useState } from 'react'
import { reducedMotion } from '@/lib/lenis'

const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/** The string a departure-board row shows: each tile flips through the alphabet until it lands on its letter. */
export function useSplitFlap(text: string, length: number): string {
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

  return reducedMotion() ? target : shown
}
