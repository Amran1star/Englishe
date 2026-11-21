'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/layout/logo'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { SignOutButton } from '@/components/auth/sign-out-button'

const LINKS = [
  { href: '/dashboard', label: 'لوحتي' },
  { href: '/levels', label: 'المستويات' },
  { href: '/grammar', label: 'القواعد' },
  { href: '/vocabulary', label: 'المفردات' },
  { href: '/reading', label: 'القراءة' },
  { href: '/listening', label: 'الاستماع' },
  { href: '/writing', label: 'الكتابة' },
  { href: '/tutor', label: 'المدرّس الذكي' },
  { href: '/pdf-quiz', label: 'PDF إلى اختبار' },
  { href: '/results', label: 'النتائج' },
  { href: '/profile', label: 'حسابي' },
]

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname()
  const links = isAdmin ? [...LINKS, { href: '/admin', label: 'الإدارة' }] : LINKS
  return (
    <header className="sticky top-0 z-40 border-b bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
      <nav className="mx-auto max-w-5xl overflow-x-auto px-2 sm:px-4" aria-label="التنقل">
        <ul className="flex w-max gap-1 pb-2">
          {links.map((l) => {
            const active = path === l.href || path.startsWith(l.href + '/')
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${active ? 'bg-brand text-brand-fg' : 'text-muted hover:bg-surface-2 hover:text-fg'}`}
                >
                  {l.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
