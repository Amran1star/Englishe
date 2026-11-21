import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { LEVELS } from '@/lib/levels'
import type { QuizQuestion } from '@/lib/types'
import { QuizRunner } from '@/components/learn/quiz-runner'
import { Alert } from '@/components/ui/alert'

export const metadata: Metadata = { title: 'اختبار' }

export default async function QuizPage({ params }: { params: { id: string } }) {
  const { supabase, user, profile } = await requireUser(`/quizzes/${params.id}`)
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, scope, title_ar, pass_score, time_limit_seconds, level_code, lesson_id')
    .eq('id', params.id)
    .maybeSingle()
  if (!quiz) notFound()

  const levelIdx = LEVELS.findIndex((l) => l.code === quiz.level_code)
  if (quiz.scope !== 'placement' && levelIdx > profile.unlocked_level_index) redirect('/levels')

  if (quiz.scope === 'level') {
    const [{ data: lessons }, { data: prog }] = await Promise.all([
      supabase.from('lessons').select('id, units!inner(level_code)').eq('units.level_code', quiz.level_code).eq('is_published', true),
      supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id).eq('status', 'completed'),
    ])
    const done = new Set((prog ?? []).map((p: { lesson_id: string }) => p.lesson_id))
    if ((lessons ?? []).some((l: { id: string }) => !done.has(l.id))) {
      return (
        <div className="space-y-4">
          <Alert kind="info">أكمل كل دروس المستوى أولاً، ثم عد إلى الاختبار النهائي.</Alert>
          <Link href={`/levels/${quiz.level_code}`} className="text-brand hover:underline">العودة إلى المستوى</Link>
        </div>
      )
    }
  }

  const { data: qs } = await supabase.from('questions').select('id, type, body, sort_order').eq('quiz_id', quiz.id).order('sort_order')
  const questions = (qs ?? []) as QuizQuestion[]
  if (questions.length === 0) return <Alert kind="info">لا توجد أسئلة في هذا الاختبار بعد.</Alert>

  const back =
    quiz.scope === 'lesson' && quiz.lesson_id
      ? { href: `/lessons/${quiz.lesson_id}`, label: 'العودة إلى الدرس' }
      : quiz.scope === 'placement'
        ? { href: '/levels', label: 'عرض المستويات' }
        : { href: `/levels/${quiz.level_code}`, label: 'العودة إلى المستوى' }

  return (
    <QuizRunner
      quizId={quiz.id}
      title={quiz.title_ar}
      scope={quiz.scope}
      passScore={quiz.pass_score}
      questions={questions}
      timeLimit={quiz.time_limit_seconds}
      backHref={back.href}
      backLabel={back.label}
    />
  )
}
