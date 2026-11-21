import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CheckCircle2, Lightbulb } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { LEVELS } from '@/lib/levels'
import type { Item, LessonContent } from '@/lib/types'
import { ExerciseRunner } from '@/components/learn/exercise-runner'
import { LessonTimer } from '@/components/learn/lesson-timer'
import { SpeakButton } from '@/components/speech/speak-button'
import { SpeechControls } from '@/components/speech/speech-controls'
import { Pronunciation } from '@/components/speech/pronunciation'
import { buttonStyles } from '@/components/ui/button'

export const metadata: Metadata = { title: 'الدرس' }

interface LessonRow {
  id: string
  title_en: string
  title_ar: string
  objective_ar: string | null
  content: LessonContent
  estimated_minutes: number
  xp_reward: number
  unit_id: string
  sort_order: number
  units: { title_ar: string; level_code: string } | { title_ar: string; level_code: string }[]
}

export default async function LessonPage({ params }: { params: { id: string } }) {
  const { supabase, user, profile } = await requireUser(`/lessons/${params.id}`)
  const { data } = await supabase
    .from('lessons')
    .select('id, title_en, title_ar, objective_ar, content, estimated_minutes, xp_reward, unit_id, sort_order, units(title_ar, level_code)')
    .eq('id', params.id)
    .maybeSingle()
  if (!data) notFound()
  const lesson = data as unknown as LessonRow
  const unit = Array.isArray(lesson.units) ? lesson.units[0] : lesson.units
  const levelIdx = LEVELS.findIndex((l) => l.code === unit.level_code)
  if (levelIdx > profile.unlocked_level_index) redirect('/levels')

  const [{ data: ex }, { data: quiz }, { data: prog }, { data: siblings }] = await Promise.all([
    supabase.from('exercises').select('content, sort_order').eq('lesson_id', lesson.id).order('sort_order'),
    supabase.from('quizzes').select('id, pass_score').eq('lesson_id', lesson.id).eq('scope', 'lesson').maybeSingle(),
    supabase.from('lesson_progress').select('status, best_score').eq('user_id', user.id).eq('lesson_id', lesson.id).maybeSingle(),
    supabase.from('lessons').select('id, title_ar, sort_order').eq('unit_id', lesson.unit_id).order('sort_order'),
  ])
  const items = ((ex ?? []) as { content: Item }[]).map((e) => e.content)
  const next = (siblings ?? []).find((s: { sort_order: number }) => s.sort_order > lesson.sort_order) as { id: string; title_ar: string } | undefined
  const c = lesson.content ?? {}
  const completed = prog?.status === 'completed'

  return (
    <div className="space-y-6">
      <LessonTimer lessonId={lesson.id} />
      <div>
        <Link href={`/levels/${unit.level_code}`} className="text-sm text-brand hover:underline">← {unit.title_ar}</Link>
        <h1 className="mt-2 text-2xl font-bold">{lesson.title_ar}</h1>
        <p className="text-sm text-muted" dir="ltr">{lesson.title_en}</p>
        {lesson.objective_ar && <p className="mt-2 rounded-xl bg-brand-soft p-3 text-sm"><b>الهدف:</b> {lesson.objective_ar}</p>}
        {completed && <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" />أكملت هذا الدرس (أفضل نتيجة {prog?.best_score}%)</p>}
      </div>

      <SpeechControls />

      <section className="space-y-3 rounded-2xl border bg-surface p-5">
        <h2 className="font-bold">الشرح</h2>
        {(c.explain ?? []).map((p, i) => <p key={i} className="leading-8">{p}</p>)}
      </section>

      {c.rule && (
        <section className="rounded-2xl border border-accent/50 bg-accent/10 p-5">
          <h2 className="mb-2 flex items-center gap-2 font-bold"><Lightbulb className="h-4 w-4 text-accent" aria-hidden />{c.rule.title}</h2>
          <ul className="list-disc space-y-1.5 ps-5">
            {c.rule.points.map((p, i) => <li key={i} dir="auto" className="leading-7">{p}</li>)}
          </ul>
        </section>
      )}

      {[{ title: 'أمثلة', list: c.examples }, { title: 'من الحياة اليومية', list: c.daily }].map(
        (g) =>
          g.list && g.list.length > 0 && (
            <section key={g.title} className="space-y-3 rounded-2xl border bg-surface p-5">
              <h2 className="font-bold">{g.title}</h2>
              <ul className="space-y-4">
                {g.list.map((e, i) => (
                  <li key={i} className="space-y-1.5">
                    <div className="flex items-start gap-3">
                      <SpeakButton text={e.en} />
                      <div><p dir="ltr" className="text-lg font-medium">{e.en}</p><p className="text-sm text-muted">{e.ar}</p></div>
                    </div>
                    <details className="ms-11 text-sm">
                      <summary className="cursor-pointer text-brand">تدرّب على نطقها</summary>
                      <div className="mt-2"><Pronunciation target={e.en} /></div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          )
      )}

      {items.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">تمارين</h2>
          <ExerciseRunner items={items} />
        </section>
      )}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-surface p-5">
        <div>
          <p className="font-bold">اختبار الدرس</p>
          <p className="text-sm text-muted">درجة النجاح {quiz?.pass_score ?? 70}% — تحصل على {lesson.xp_reward} نقطة عند أول نجاح.</p>
        </div>
        <div className="flex gap-2">
          {quiz && <Link href={`/quizzes/${quiz.id}`} className={buttonStyles('primary', 'md')}>{completed ? 'أعد الاختبار' : 'ابدأ الاختبار'}</Link>}
          {completed && next && <Link href={`/lessons/${next.id}`} className={buttonStyles('secondary', 'md')}>الدرس التالي</Link>}
        </div>
      </section>
    </div>
  )
}
