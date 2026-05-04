'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Pokédex' },
  { href: '/battles', label: 'Battles' },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 flex items-center gap-1 border-b border-pc-border bg-pc-bg px-4 py-2">
      {links.map(({ href, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            className={`rounded px-3 py-1.5 text-sm font-semibold transition ${active ? 'bg-[--pc-accent] text-white' : 'text-white/50 hover:text-white'}`}
            href={href}
            key={href}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
