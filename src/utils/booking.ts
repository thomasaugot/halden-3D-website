/** Checks the booking form; returns one message per invalid field, empty when the request is good. */
export function validateBooking(data: FormData): Record<string, string> {
  const next: Record<string, string> = {}
  if (!String(data.get('to') ?? '').trim()) next.to = 'Add a destination, a city or an airport code is enough.'
  if (!data.get('date')) next.date = 'Pick a departure date.'
  if (!String(data.get('name') ?? '').trim()) next.name = 'Add the name we should ask for.'
  const phone = String(data.get('phone') ?? '').replace(/\s/g, '')
  if (!/^\+?\d{7,15}$/.test(phone)) next.phone = 'Add a phone number with its country code, starting with +.'
  return next
}
