'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

// Transparent over the homepage hero until the visitor scrolls; solid white everywhere else.
export default function HeaderShell({ homePath, children }: { homePath: string; children: ReactNode }) {
  const overHero = usePathname() === homePath
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!overHero) return
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [overHero])

  const solid = !overHero || scrolled

  return (
    <header
      data-solid={solid}
      className={`group/header sticky top-0 z-40 transition-colors duration-300 ${solid ? 'bg-white shadow-sm' : 'bg-transparent'}`}
    >
      {children}
    </header>
  )
}
