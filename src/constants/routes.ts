import { distanceKm, flightTime } from '@/utils/geo'
import type { Airport } from '@/types/routes'

export const HOME: Airport = { code: 'GVA', city: 'Geneva', country: 'Switzerland', lat: 46.238, lon: 6.109 }

export const DESTINATIONS: Airport[] = [
  { code: 'RAK', city: 'Marrakech', country: 'Morocco', lat: 31.607, lon: -8.036 },
  { code: 'JMK', city: 'Mykonos', country: 'Greece', lat: 37.435, lon: 25.348 },
  { code: 'DWC', city: 'Dubai', country: 'United Arab Emirates', lat: 24.896, lon: 55.161 },
  { code: 'TEB', city: 'New York', country: 'United States', lat: 40.85, lon: -74.061 },
  { code: 'ASE', city: 'Aspen', country: 'United States', lat: 39.223, lon: -106.869 },
  { code: 'HND', city: 'Tokyo', country: 'Japan', lat: 35.553, lon: 139.78 },
]

export const ROUTES = DESTINATIONS.map((to) => {
  const km = distanceKm(HOME, to)
  return { to, km: Math.round(km / 10) * 10, time: flightTime(km) }
})
