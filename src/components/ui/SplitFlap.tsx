import { useSplitFlap } from '@/hooks/useSplitFlap'

interface Props {
  text: string
  length: number
  className?: string
}

/** A departure-board row: each tile flips through the alphabet until it lands on its letter. */
export function SplitFlap({ text, length, className = '' }: Props) {
  const shown = useSplitFlap(text, length)

  return (
    <span className={`inline-flex gap-1 ${className}`} aria-label={text}>
      {Array.from(shown, (ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="relative grid h-[1.75em] w-[1.3em] place-items-center overflow-hidden rounded-md bg-panel font-mono text-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_2px_rgb(0_0_0/0.4)]"
        >
          {ch}
          <span className="absolute inset-x-0 top-1/2 h-px bg-ground/80" />
        </span>
      ))}
    </span>
  )
}
