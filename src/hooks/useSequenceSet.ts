import { useEffect, useState } from 'react'
import { getSequenceSet } from '@/services/sequences'
import { sceneReady } from '@/stores/flight'
import type { Cut, SequenceSet } from '@/types/film'

/** The film's frame counts for a cut. Swaps in place when the cut changes; if the manifest cannot load, the page is let through. */
export function useSequenceSet(cut: Cut): SequenceSet | null {
  const [set, setSet] = useState<SequenceSet | null>(null)

  useEffect(() => {
    let alive = true
    getSequenceSet(cut)
      .then((s) => alive && setSet(s))
      .catch(() => sceneReady.set(true))
    return () => {
      alive = false
    }
  }, [cut])

  return set
}
