import { ArrowRight, CheckCircle } from '@phosphor-icons/react'
import { Field } from '@/components/ui/Field'
import { CONTACT_EMAIL } from '@/constants/contact'
import { DESTINATIONS, HOME } from '@/constants/routes'
import { useBookingForm } from '@/hooks/useBookingForm'

export function HomeBooking() {
  const { errors, sent, today, submit } = useBookingForm()

  return (
    <section id="book" className="px-4 pt-16 pb-32 md:pt-24 md:pr-32 md:pb-48 md:pl-10" aria-labelledby="book-title">
      <div className="grid gap-14 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-5">
          <h2 id="book-title" className="font-wide text-display">
            Tell us where
          </h2>
          <p className="mt-5 max-w-[34ch] text-lede text-fg-2">
            A flight coordinator calls you back within 20 minutes with a price and a departure slot.
          </p>
          <p className="mt-10 text-small text-fg-2">
            Rather write?
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 block font-mono text-body text-fg underline-offset-4 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col justify-center md:col-span-6 md:col-start-7" role="status">
            <CheckCircle weight="regular" className="size-8 text-accent" />
            <p className="mt-4 font-wide text-title">Request sent</p>
            <p className="mt-2 max-w-[38ch] text-body text-fg-2">
              Keep your phone close. A flight coordinator will call you within 20 minutes.
            </p>
          </div>
        ) : (
          <form noValidate onSubmit={submit} className="grid grid-cols-2 gap-x-6 gap-y-7 md:col-span-6 md:col-start-7">
            <Field label="From" name="from" defaultValue={`${HOME.city} (${HOME.code})`} className="col-span-2 md:col-span-1" />
            <Field label="To" name="to" list="destinations" required error={errors.to} className="col-span-2 md:col-span-1" />
            <datalist id="destinations">
              {DESTINATIONS.map((d) => (
                <option key={d.code} value={`${d.city} (${d.code})`} />
              ))}
            </datalist>
            <Field label="Departure" name="date" type="date" min={today} required error={errors.date} />
            <Field label="Passengers" name="pax" type="number" min="1" defaultValue="2" />
            <Field label="Name" name="name" autoComplete="name" required error={errors.name} className="col-span-2 md:col-span-1" />
            <Field label="Phone" name="phone" type="tel" autoComplete="tel" required error={errors.phone} className="col-span-2 md:col-span-1" />
            <button
              type="submit"
              className="group col-span-2 mt-4 inline-flex w-fit items-center gap-3 rounded-lg bg-fg px-6 py-4 text-body font-medium text-ground transition-[transform,opacity] duration-200 hover:opacity-90 active:scale-[0.98]"
            >
              Request a flight
              <ArrowRight weight="regular" className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
