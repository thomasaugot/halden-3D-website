import { CRUISE_KMH, OVERHEAD_H } from '@/constants/flight'
import type { Airport } from '@/types/routes'

const EARTH_KM = 6371

const rad = (d: number) => (d * Math.PI) / 180

export function distanceKm(a: Airport, b: Airport): number {
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h))
}

export function flightTime(km: number): string {
  const hours = km / CRUISE_KMH + OVERHEAD_H
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60 / 5) * 5
  return `${h} h ${String(m).padStart(2, '0')}`
}
