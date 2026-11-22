import { useEffect, useState } from 'react'
import { activeRoute } from '@/stores/flight'

/** Index of the route the globe is pointing at. */
export function useActiveRoute(): number {
  const [i, setI] = useState(0)
  useEffect(() => activeRoute.subscribe(setI), [])
  return i
}
