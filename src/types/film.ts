export interface SequenceManifest {
  [clip: string]: { frames: number; fps: number }
}

export type Cut = 'landscape' | 'portrait'

export interface SequenceSet {
  /** folder under public/ that holds the frames */
  base: string
  manifest: SequenceManifest
}

export type Clip = 'c1-cabin' | 'c2-flyby' | 'c3-orbit' | 'c4-inside' | 'c5-climb'

type BeatKind = 'hero' | 'caption' | 'specs'

export interface Beat {
  kind: BeatKind
  /** clip the beat belongs to; from and to are local to it, 0 to 1 */
  clip: Clip
  from: number
  to: number
  id?: string
  /** where the copy sits */
  place: string
  title: string
  text: string
  meta?: string
  /** label of the call to action, hero only */
  cta?: string
}
