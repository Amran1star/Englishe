import type { Metadata } from 'next'
import { requireUser } from '@/lib/session'
import { Alert } from '@/components/ui/alert'

export const metadata: Metadata = { title: 'النتائج' }

interface Attempt {
  id: string
  score: number
  total: number
  percentage: number
  passed: boolean
  created_at: string
  duration_seconds: number | null
  answers: { id: string; correct: boolean; correct_answer: string | null; explanation: string | null }[]
  quizzes: { title_ar: string } | { title_ar: string }[] | null
}

export default async function ResultsPage() {
  const { supabase, user } = await requireUser('/results')
  const { data } = await supabase
    .from('quiz_attempts')
    .select('id, score, total, percentage, passed, created_at, duration_seconds, answers, quizzes(title_ar)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)
  const attempts = (data ?? []) as unknown as Attempt[]
  const ids = Array.from(new Set(attempts.flatMap((a) => a.answers.map((x) => x.id))))
  const { data: qs } = ids.length ? await supabase.from('questions').select('id, body').in('id', ids) : { data: [] }
  const prompt = new Map(((qs ?? []) as { id: string; body: { prompt: string } }[]).map((q) => [q.id, q.body.prompt]))

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">نتائج الاختبارات</h1>
      {attempts.length === 0 && <Alert kind="info">لم تجرِ أي اختبار بعد.</Alert>}
      <ul className="space-y-3">
        {attempts.map((a) => {
          const title = Array.isArray(a.quizzes) ? a.quizzes[0]?.title_ar : a.quizzes?.title_ar
          return (
            <li key={a.id} className="rounded-2xl border bg-surface">
              <details>
                <summary className="flex cursor-pointer items-center justify-between gap-3 p-4">
                  <span className="min-w-0">
                    <span className="block truncate font-medium" dir="auto">{title}</span>
                    <span className="text-xs text-muted">{new Date(a.created_at).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' })} · {a.score}/{a.total}</span>
                  </span>
                  <span className={`shrink-0 text-lg font-bold ${a.passed ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">{Math.round(a.percentage)}%</span>
                </summary>
                <ol className="space-y-2 border-t p-4 text-sm">
                  {a.answers.map((x, i) => (
                    <li key={x.id} className={x.correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}>
                      <p dir="auto" className="font-medium">{i + 1}. {prompt.get(x.id) ?? 'سؤال'}</p>
                      {!x.correct && <p>الصحيح: <b dir="auto">{x.correct_answer}</b></p>}
                      {x.explanation && <p className="text-fg/70">{x.explanation}</p>}
                    </li>
                  ))}
                </ol>
              </details>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
