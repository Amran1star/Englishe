import Link from 'next/link'
import { Logo } from './logo'

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted" dir="ltr">Master English, Step by Step.</p>
        </div>
        <nav className="flex gap-6 text-sm text-muted" aria-label="روابط التذييل">
          <Link href="/login" className="hover:text-fg">تسجيل الدخول</Link>
          <Link href="/register" className="hover:text-fg">إنشاء حساب</Link>
        </nav>
      </div>
      <p className="border-t py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} English Mastery
      </p>
    </footer>
  )
}
