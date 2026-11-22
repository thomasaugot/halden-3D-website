import type { Cut, SequenceManifest, SequenceSet } from '@/types/film'

const cache = new Map<Cut, Promise<SequenceSet>>()

function fetchSet(base: string): Promise<SequenceSet> {
  return fetch(`/${base}/manifest.json`).then((r) => {
    if (!r.ok) throw new Error(`${base} manifest ${r.status}`)
    return (r.json() as Promise<SequenceManifest>).then((manifest) => {
      if (Object.keys(manifest).length === 0) throw new Error(`${base} manifest is empty`)
      return { base, manifest }
    })
  })
}

/**
 * Frame counts for the film, written by tools/video/chain.py. The portrait
 * cut (9:16, public/seq-portrait) falls back to the landscape one if it is
 * missing, so the page never ends up without footage.
 */
export function getSequenceSet(cut: Cut): Promise<SequenceSet> {
  let p = cache.get(cut)
  if (!p) {
    p = cut === 'portrait' ? fetchSet('seq-portrait').catch(() => fetchSet('seq')) : fetchSet('seq')
    cache.set(cut, p)
  }
  return p
}
