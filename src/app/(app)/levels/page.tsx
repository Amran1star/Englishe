import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Lock } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { LEVELS } from '@/lib/levels'
import { buttonStyles } from '@/components/ui/button'

export const metadata: Metadata = { title: 'المستويات' }

export default async function LevelsPage() {
  const { supabase, profile } = await requireUser('/levels')
  const { data } = await supabase.rpc('student_dashboard')
  const progress = new Map<string, { total: number; done: number }>(
    ((data?.levels ?? []) as { code: string; total: number; done: number }[]).map((l) => [l.code, l])
  )
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">المستويات</h1>
          <p className="mt-1 text-sm text-muted">أكمل دروس المستوى ثم اجتز اختباره النهائي لفتح المستوى التالي.</p>
        </div>
        {!profile.placement_completed && <Link href="/placement" className={buttonStyles('secondary', 'md')}>اختبار تحديد المستوى</Link>}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {LEVELS.map((l, i) => {
          const locked = i > profile.unlocked_level_index
          const p = progress.get(l.code) ?? { total: 0, done: 0 }
          const pct = p.total ? Math.round((p.done / p.total) * 100) : 0
          const inner = (
            <div className={`h-full rounded-2xl border bg-surface p-5 ${locked ? 'opacity-60' : 'transition-colors hover:border-brand'}`}>
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-lg font-bold text-brand" dir="ltr">{l.code}</span>
                {locked ? <Lock className="h-5 w-5 text-muted" aria-label="مقفل" /> : <ChevronLeft className="h-5 w-5 text-muted" aria-hidden />}
              </div>
              <p className="mt-3 font-semibold">{l.titleAr}</p>
              <p className="text-sm text-muted" dir="ltr">{l.titleEn}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>
              <p className="mt-1.5 text-xs text-muted">{locked ? 'اجتز اختبار المستوى السابق لفتحه' : `${p.done} من ${p.total} دروس`}</p>
            </div>
          )
          return <li key={l.code}>{locked ? inner : <Link href={`/levels/${l.code}`} className="block h-full">{inner}</Link>}</li>
        })}
      </ul>
    </div>
  )
}
