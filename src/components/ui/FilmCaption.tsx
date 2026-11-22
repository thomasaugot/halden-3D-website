interface FilmCaptionProps {
  title: string
  text: string
  meta?: string
}

export function FilmCaption({ title, text, meta }: FilmCaptionProps) {
  return (
    <>
      {meta && <p className="mb-3 font-mono text-micro text-contrail/70">{meta}</p>}
      <h2 className="font-wide text-display text-contrail">{title}</h2>
      <p className="mt-4 max-w-[38ch] text-lede text-contrail/80">{text}</p>
    </>
  )
}
