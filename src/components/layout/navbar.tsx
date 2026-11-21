import Link from 'next/link'
import { Logo } from './logo'
import { ThemeToggle } from './theme-toggle'
import { buttonStyles } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export async function Navbar() {
  let signedIn = false
  if (isSupabaseConfigured()) {
    try {
      const {
        data: { user },
      } = await createClient().auth.getUser()
      signedIn = Boolean(user)
    } catch {
      signedIn = false
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex" aria-label="التنقل الرئيسي">
          <a href="#levels" className="hover:text-fg">المستويات</a>
          <a href="#features" className="hover:text-fg">المزايا</a>
          <a href="#how" className="hover:text-fg">كيف تبدأ</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {signedIn ? (
            <Link href="/dashboard" className={buttonStyles('primary', 'md')}>لوحة التحكم</Link>
          ) : (
            <>
              <Link href="/login" className={`${buttonStyles('ghost', 'md')} hidden sm:inline-flex`}>
                تسجيل الدخول
              </Link>
              <Link href="/register" className={buttonStyles('primary', 'md')}>أنشئ حساباً</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
