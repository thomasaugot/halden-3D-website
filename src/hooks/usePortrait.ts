import { useSyncExternalStore } from 'react'

/** Taller than wide: phones, and tablets held upright. These get the 9:16 cut of the film. */
const QUERY = '(max-aspect-ratio: 1/1)'

function subscribe(cb: () => void): () => void {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export function usePortrait(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches)
}
