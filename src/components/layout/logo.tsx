import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="English Mastery — الصفحة الرئيسية">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-fg">
        <GraduationCap className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-lg font-bold tracking-tight" dir="ltr">English Mastery</span>
    </Link>
  )
}
