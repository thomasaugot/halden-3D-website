/** The Halden mark: an H whose crossbar climbs, like a departure. */
export function Mark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" className="fill-current" />
      <path d="M8 7h4v7.2l8-2.4V7h4v18h-4v-9.1l-8 2.4V25H8z" className="fill-[var(--mark-cut,var(--ground))]" />
    </svg>
  )
}
