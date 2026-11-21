import Link from 'next/link'
import { requireAdmin } from '@/lib/session'

const TABS = [
  { href: '/admin', label: 'نظرة عامة' },
  { href: '/admin/users', label: 'المستخدمون' },
  { href: '/admin/content', label: 'المحتوى' },
  { href: '/admin/quizzes', label: 'الاختبارات والأسئلة' },
  { href: '/admin/pdfs', label: 'ملفات PDF' },
  { href: '/admin/settings', label: 'الإعدادات' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">لوحة المدير</h1>
      <nav className="flex flex-wrap gap-2" aria-label="أقسام الإدارة">
        {TABS.map((t) => <Link key={t.href} href={t.href} className="rounded-xl border bg-surface px-3.5 py-2 text-sm font-medium hover:bg-surface-2">{t.label}</Link>)}
      </nav>
      {children}
    </div>
  )
}
