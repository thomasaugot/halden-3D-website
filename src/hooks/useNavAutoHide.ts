import { useEffect, useRef } from 'react'

/** Hides the header while the page scrolls down, brings it back on the way up. Attach the returned ref to the header. */
export function useNavAutoHide() {
  const header = useRef<HTMLElement>(null)

  useEffect(() => {
    let last = window.scrollY
    let hidden = false
    const onScroll = () => {
      const el = header.current
      if (!el) return
      const y = window.scrollY
      const delta = y - last
      if (Math.abs(delta) > 6) {
        const hide = delta > 0 && y > 120
        if (hide !== hidden) {
          hidden = hide
          el.dataset.hidden = String(hide)
        }
        last = y
      }
      el.dataset.solid = String(y > 40)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return header
}
