import type { Beat, Clip } from '@/types/film'

export const CLIPS: readonly Clip[] = ['c1-cabin', 'c2-flyby', 'c3-orbit', 'c4-inside', 'c5-climb']

/** The clip the page lands with, played by the footer. */
export const LANDING_CLIP = 'c6-landing'

/** Scroll length per second of footage. */
export const SVH_PER_SECOND = 62

const LOW_LEFT = 'bottom-0 left-0 px-4 pb-10 md:px-10 md:pb-14'
const LOW_WIDE = 'bottom-0 left-0 right-0 px-4 pb-10 md:px-10 md:pb-14'

export const BEATS: Beat[] = [
  {
    kind: 'hero',
    clip: 'c1-cabin',
    from: 0,
    to: 0.3,
    place: LOW_WIDE,
    title: 'Private jets from Geneva',
    text: 'One aircraft, two captains, a flight plan filed the moment you call. Wheels up three hours later.',
    cta: 'Request a flight',
  },
  {
    kind: 'caption',
    clip: 'c1-cabin',
    from: 0.55,
    to: 0.98,
    place: LOW_LEFT,
    title: 'Your cabin, your hour',
    text: 'Nobody else boards. The aircraft waits for you, not the other way round.',
  },
  {
    kind: 'caption',
    clip: 'c2-flyby',
    from: 0.4,
    to: 1,
    place: LOW_LEFT,
    meta: 'Halden H7',
    title: 'Leave when you are ready',
    text: 'A slot at Geneva within three hours, any day of the year, any hour of the night.',
  },
  {
    kind: 'specs',
    clip: 'c3-orbit',
    from: 0.1,
    to: 0.92,
    id: 'aircraft',
    place: LOW_WIDE,
    title: 'One aircraft type',
    text: 'Every Halden flight is an H7. Same cabin, same crew procedures, nothing to learn twice.',
  },
  {
    kind: 'caption',
    clip: 'c4-inside',
    from: 0.06,
    to: 0.34,
    id: 'cabin',
    place: LOW_LEFT,
    meta: 'Forward cabin',
    title: 'Club suite',
    text: 'Four seats face to face. They swivel, recline flat and sit beside the largest windows in the class.',
  },
  {
    kind: 'caption',
    clip: 'c4-inside',
    from: 0.4,
    to: 0.66,
    place: LOW_LEFT,
    meta: 'Mid cabin',
    title: 'Dining',
    text: 'The galley cooks to order. Tell us what you eat and it is aboard before you are.',
  },
  {
    kind: 'caption',
    clip: 'c4-inside',
    from: 0.72,
    to: 1,
    place: LOW_LEFT,
    meta: 'Aft cabin',
    title: 'Stateroom',
    text: 'A double bed, a shower and a door that closes, eleven hours from Tokyo.',
  },
  {
    kind: 'caption',
    clip: 'c5-climb',
    from: 0.35,
    to: 1,
    place: LOW_LEFT,
    title: 'Above the weather by minute twenty',
    text: 'The H7 cruises at 15,500 m, three kilometres over the airlines, where the air is still and the sky turns dark.',
  },
]
