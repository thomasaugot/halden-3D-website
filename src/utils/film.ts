import type { Beat, Clip, SequenceManifest } from '@/types/film'

export function sequenceUrls(
  manifest: SequenceManifest,
  clips: string[],
  base = 'seq',
): { urls: string[]; bounds: number[] } {
  const urls: string[] = []
  const bounds: number[] = [0]
  for (const clip of clips) {
    const n = manifest[clip]?.frames ?? 0
    for (let i = 1; i <= n; i++) urls.push(`/${base}/${clip}/${String(i).padStart(4, '0')}.jpg`)
    bounds.push(urls.length)
  }
  return { urls, bounds: bounds.map((b) => b / Math.max(1, urls.length)) }
}

/** Where a clip starts and ends on the film's 0..1 timeline. */
export function clipSpan(clips: readonly Clip[], bounds: number[], clip: Clip): readonly [number, number] {
  const i = clips.indexOf(clip)
  return [bounds[i], bounds[i + 1]] as const
}

/** Maps each beat's clip-local from/to onto the film's 0..1 timeline. */
export function beatRanges(beats: Beat[], clips: readonly Clip[], bounds: number[]): (readonly [number, number])[] {
  return beats.map((b) => {
    const [a, z] = clipSpan(clips, bounds, b.clip)
    return [a + (z - a) * b.from, a + (z - a) * b.to] as const
  })
}

/** Scroll height of the film section, in svh, from the footage length. */
export function filmHeightSvh(manifest: SequenceManifest, clips: readonly Clip[], svhPerSecond: number): number {
  const seconds = clips.reduce((s, c) => s + (manifest[c]?.frames ?? 0) / (manifest[c]?.fps ?? 15), 0)
  return Math.round(seconds * svhPerSecond + 100)
}
