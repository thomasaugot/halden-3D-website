const PLANS = [
  {
    name: 'Charter',
    price: 'From CHF 11,400 an hour',
    text: 'One trip, priced before you commit, ready three hours after you call.',
  },
  {
    name: 'Jet card',
    price: '25 hours at a fixed rate',
    text: 'Prepaid hours at a locked price. Guaranteed aircraft with 24 hours notice, no peak days.',
  },
]

export function Membership() {
  return (
    <section id="membership" className="px-4 pt-32 pb-28 md:pt-48 md:pr-32 md:pb-40 md:pl-10" aria-labelledby="membership-title">
      <h2 id="membership-title" className="max-w-[16ch] font-wide text-display">
        Three ways to fly with us
      </h2>

      <div className="mt-14 grid gap-14 md:mt-24 md:grid-cols-12 md:gap-10">
        <figure className="md:col-span-7">
          <div className="overflow-hidden rounded-2xl">
            <img
              src="/images/boarding.jpg"
              alt="A Halden H7 on a wet apron at dusk with the Alps behind and its airstair open"
              loading="lazy"
              decoding="async"
              sizes="(min-width: 768px) 58vw, 100vw"
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
          <figcaption className="mt-8 grid gap-4 md:grid-cols-[1fr_1.4fr] md:gap-10">
            <div>
              <h3 className="font-wide text-title">Share</h3>
              <p className="mt-2 font-mono text-small text-fg-2">One eighth of an H7, 100 hours a year</p>
            </div>
            <p className="text-body text-fg-2">
              Own part of the aircraft and fly it as if it were entirely yours. We crew it, hangar it and maintain it,
              and buy your share back at market value whenever you like.
            </p>
          </figcaption>
        </figure>

        <div className="flex flex-col gap-14 md:col-span-4 md:col-start-9 md:justify-end md:gap-20">
          {PLANS.map((p) => (
            <article key={p.name}>
              <h3 className="font-wide text-title">{p.name}</h3>
              <p className="mt-2 font-mono text-small text-fg-2">{p.price}</p>
              <p className="mt-5 text-body text-fg-2">{p.text}</p>
            </article>
          ))}
          <p className="text-micro text-fg-2/70">Indicative prices, excluding VAT and airport fees</p>
        </div>
      </div>
    </section>
  )
}
