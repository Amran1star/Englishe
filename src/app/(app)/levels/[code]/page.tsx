import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CheckCircle2, Circle, Trophy } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { LEVELS } from '@/lib/levels'
import { buttonStyles } from '@/components/ui/button'

export const metadata: Metadata = { title: 'وحدات المستوى' }

interface Lesson { id: string; title_en: string; title_ar: string; objective_ar: string | null; sort_order: number; estimated_minutes: number }
interface Unit { id: string; title_en: string; title_ar: string; description_ar: string | null; sort_order: number; lessons: Lesson[] }

export default async function LevelPage({ params }: { params: { code: string } }) {
  const idx = LEVELS.findIndex((l) => l.code === params.code)
  if (idx === -1) notFound()
  const { supabase, user, profile } = await requireUser(`/levels/${params.code}`)
  if (idx > profile.unlocked_level_index) redirect('/levels')
  const level = LEVELS[idx]

  const [{ data: units }, { data: prog }, { data: quizzes }] = await Promise.all([
    supabase.from('units').select('id, title_en, title_ar, description_ar, sort_order, lessons(id, title_en, title_ar, objective_ar, sort_order, estimated_minutes)')
      .eq('level_code', level.code).eq('is_published', true).order('sort_order'),
    supabase.from('lesson_progress').select('lesson_id, status').eq('user_id', user.id),
    supabase.from('quizzes').select('id, scope, unit_id').eq('level_code', level.code).in('scope', ['unit', 'level']).eq('is_published', true),
  ])
  const done = new Set((prog ?? []).filter((p: { status: string }) => p.status === 'completed').map((p: { lesson_id: string }) => p.lesson_id))
  const unitList = ((units ?? []) as Unit[]).map((u) => ({ ...u, lessons: [...u.lessons].sort((a, b) => a.sort_order - b.sort_order) }))
  const allLessons = unitList.flatMap((u) => u.lessons)
  const allDone = allLessons.length > 0 && allLessons.every((l) => done.has(l.id))
  const levelQuiz = (quizzes ?? []).find((q: { scope: string }) => q.scope === 'level') as { id: string } | undefined
  const unitQuiz = (uid: string) => (quizzes ?? []).find((q: { scope: string; unit_id: string }) => q.scope === 'unit' && q.unit_id === uid) as { id: string } | undefined

  return (
    <div className="space-y-6">
      <div>
        <Link href="/levels" className="text-sm text-brand hover:underline">← كل المستويات</Link>
        <h1 className="mt-2 text-2xl font-bold"><span dir="ltr">{level.code}</span> — {level.titleAr}</h1>
        <p className="text-sm text-muted">{allLessons.filter((l) => done.has(l.id)).length} من {allLessons.length} دروس مكتملة</p>
      </div>

      {unitList.map((u) => {
        const uDone = u.lessons.length > 0 && u.lessons.every((l) => done.has(l.id))
        const uq = unitQuiz(u.id)
        return (
          <section key={u.id} className="rounded-2xl border bg-surface p-5">
            <h2 className="text-lg font-bold">{u.title_ar} <span className="text-sm font-normal text-muted" dir="ltr">· {u.title_en}</span></h2>
            {u.description_ar && <p className="mt-1 text-sm text-muted">{u.description_ar}</p>}
            <ol className="mt-4 divide-y">
              {u.lessons.map((l) => (
                <li key={l.id}>
                  <Link href={`/lessons/${l.id}`} className="flex items-center gap-3 py-3 hover:text-brand">
                    {done.has(l.id) ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-label="مكتمل" /> : <Circle className="h-5 w-5 shrink-0 text-muted" aria-hidden />}
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{l.title_ar}</span>
                      {l.objective_ar && <span className="block truncate text-xs text-muted">{l.objective_ar}</span>}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{l.estimated_minutes} د</span>
                  </Link>
                </li>
              ))}
            </ol>
            {uq && (
              <div className="mt-4">
                <Link href={`/quizzes/${uq.id}`} className={buttonStyles(uDone ? 'primary' : 'secondary', 'md')}>اختبار الوحدة</Link>
              </div>
            )}
          </section>
        )
      })}

      {levelQuiz && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/50 bg-accent/10 p-5">
          <div className="flex items-center gap-3"><Trophy className="h-6 w-6 text-accent" aria-hidden />
            <div><p className="font-bold">الاختبار النهائي للمستوى</p>
              <p className="text-sm text-muted">{allDone ? 'اجتزه لفتح المستوى التالي.' : 'يُفتح بعد إكمال كل دروس المستوى.'}</p></div>
          </div>
          {allDone ? <Link href={`/quizzes/${levelQuiz.id}`} className={buttonStyles('primary', 'md')}>ابدأ الاختبار</Link> : <span className="text-sm text-muted">أكمل الدروس أولاً</span>}
        </section>
      )}
    </div>
  )
}
