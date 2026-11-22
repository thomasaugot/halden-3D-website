import type { SequenceManifest } from '../lib/FrameSequence'

let cached: Promise<SequenceManifest> | null = null

/** Frame counts for every clip in public/seq, written by tools/video/chain.py. */
export function getSequenceManifest(): Promise<SequenceManifest> {
  cached ??= fetch('/seq/manifest.json').then((r) => {
    if (!r.ok) throw new Error(`manifest ${r.status}`)
    return r.json() as Promise<SequenceManifest>
  })
  return cached
}
