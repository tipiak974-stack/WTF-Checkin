import { useState } from 'react'

const DEFAULT_LOGO = '/default-logo.svg'

export function EventLogo({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  const [errored, setErrored] = useState(false)
  const resolvedSrc = !src || errored ? DEFAULT_LOGO : src

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className ?? 'h-12 w-12 rounded-lg object-cover'}
      onError={() => setErrored(true)}
    />
  )
}
