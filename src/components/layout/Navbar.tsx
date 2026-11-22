import { useNavAutoHide } from '@/hooks/useNavAutoHide'
import { scrollToId } from '@/lib/lenis'
import { BrandMark } from '@/components/ui/BrandMark'

const LINKS = [
  { id: 'cabin', label: 'Cabin' },
  { id: 'routes', label: 'Routes' },
  { id: 'membership', label: 'Membership' },
]

/** Hides while you scroll down through the flight, comes back the moment you scroll up. */
export function Navbar() {
  const header = useNavAutoHide()

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToId(id)
  }

  return (
    <header
      ref={header}
      data-hidden="false"
      data-solid="false"
      className="group/nav fixed inset-x-0 top-0 z-40 text-contrail transition-[transform,background-color,backdrop-filter,color] duration-500 ease-flight [--mark-cut:var(--color-stratos)] data-[hidden=true]:-translate-y-full data-[solid=true]:bg-ground/75 data-[solid=true]:text-fg data-[solid=true]:backdrop-blur-xl data-[solid=true]:[--mark-cut:var(--ground)]"
    >
      <nav className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:h-[4.5rem] md:px-8" aria-label="Main">
        <a href="#hero" onClick={go('hero')} className="flex items-center gap-2.5" aria-label="Halden, back to top">
          <BrandMark className="size-7" />
          <span className="font-wide text-body">Halden</span>
        </a>
        <div className="flex items-center gap-1 md:gap-2">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={go(l.id)}
              className="hidden rounded-lg px-3.5 py-2 text-small transition-colors duration-300 hover:bg-current/10 md:block"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#book"
            onClick={go('book')}
            className="ml-1 rounded-lg bg-contrail px-4 py-2 text-small font-medium text-stratos transition-[transform,opacity,background-color,color] duration-200 group-data-[solid=true]/nav:bg-fg group-data-[solid=true]/nav:text-ground hover:opacity-90 active:scale-[0.98] md:ml-3 md:px-5 md:py-2.5"
          >
            Request a flight
          </a>
        </div>
      </nav>
    </header>
  )
}
