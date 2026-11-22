import { useState, type FormEvent } from 'react'
import { validateBooking } from '@/utils/booking'

/** State and submit handler of the booking form. `today` is the earliest departure date. */
export function useBookingForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState(false)
  const [today] = useState(() => new Date().toISOString().slice(0, 10))

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const next = validateBooking(new FormData(e.currentTarget))
    setErrors(next)
    if (Object.keys(next).length === 0) setSent(true)
  }

  return { errors, sent, today, submit }
}
