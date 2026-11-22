import { ScrollTrigger } from '@/lib/gsap'
import { instrument } from '@/stores/flight'

/** The descent: from cruise to the approach while the offer and the booking form scroll past. */
export function descentAltimeter(): () => void {
  const st = ScrollTrigger.create({
    trigger: '#descent',
    start: 'top 70%',
    end: 'bottom bottom',
    onUpdate: ({ progress: p }) => {
      instrument.set({ alt: 15500 - (15500 - 1500) * p, phase: 2 })
      document.documentElement.dataset.sky = 'night'
    },
  })
  return () => st.kill()
}
