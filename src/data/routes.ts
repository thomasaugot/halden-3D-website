export interface Airport {
  code: string
  city: string
  country: string
  lat: number
  lon: number
}

export const HOME: Airport = { code: 'GVA', city: 'Geneva', country: 'Switzerland', lat: 46.238, lon: 6.109 }

export const DESTINATIONS: Airport[] = [
  { code: 'RAK', city: 'Marrakech', country: 'Morocco', lat: 31.607, lon: -8.036 },
  { code: 'JMK', city: 'Mykonos', country: 'Greece', lat: 37.435, lon: 25.348 },
  { code: 'DWC', city: 'Dubai', country: 'United Arab Emirates', lat: 24.896, lon: 55.161 },
  { code: 'TEB', city: 'New York', country: 'United States', lat: 40.85, lon: -74.061 },
  { code: 'ASE', city: 'Aspen', country: 'United States', lat: 39.223, lon: -106.869 },
  { code: 'HND', city: 'Tokyo', country: 'Japan', lat: 35.553, lon: 139.78 },
]

const EARTH_KM = 6371
/** Long-range cruise speed of the H7, km/h. */
const CRUISE_KMH = 900
/** Taxi, climb and descent overhead added to every leg, hours. */
const OVERHEAD_H = 0.4

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

export const ROUTES = DESTINATIONS.map((to) => {
  const km = distanceKm(HOME, to)
  return { to, km: Math.round(km / 10) * 10, time: flightTime(km) }
})
