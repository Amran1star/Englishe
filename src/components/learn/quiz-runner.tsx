'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock, Loader2, Trophy, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Answer, QuizQuestion, QuizResult } from '@/lib/types'
import { buttonStyles } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { ItemInput } from './item-input'

interface Props {
  quizId: string
  title: string
  scope: string
  passScore: number
  questions: QuizQuestion[]
  timeLimit?: number | null
  backHref: string
  backLabel: string
}

export function QuizRunner({ quizId, title, scope, passScore, questions, timeLimit, backHref, backLabel }: Props) {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [left, setLeft] = useState<number | null>(timeLimit ?? null)
  const started = useRef(Date.now())
  const submitted = useRef(false)

  const submit = async () => {
    if (submitted.current) return
    submitted.current = true
    setSubmitting(true)
    setError(null)
    const duration = Math.round((Date.now() - started.current) / 1000)
    const { data, error } = await createClient().rpc('submit_quiz_attempt', { p_quiz_id: quizId, p_answers: answers, p_duration: duration })
    if (error) {
      submitted.current = false
      setSubmitting(false)
      setError(
        error.message.includes('level locked')
          ? 'هذا المستوى مقفل. اجتز المستوى السابق أولاً.'
          : error.message.includes('complete all lessons')
            ? 'أكمل كل دروس المستوى أولاً ثم ارجع إلى الاختبار النهائي.'
            : 'تعذّر إرسال الإجابات. تحقق من الاتصال وأعد المحاولة.'
      )
      return
    }
    setResult(data as QuizResult)
    setSubmitting(false)
    router.refresh()
  }

  useEffect(() => {
    if (left === null || result) return
    if (left <= 0) {
      submit()
      return
    }
    const t = setTimeout(() => setLeft((l) => (l === null ? l : l - 1)), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, result])

  if (result) return <ResultView result={result} questions={questions} scope={scope} passScore={passScore} backHref={backHref} backLabel={backLabel} />

  const q = questions[idx]
  const answered = Object.keys(answers).length
  const last = idx === questions.length - 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{title}</h1>
        {left !== null && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-1.5 text-sm" dir="ltr">
            <Clock className="h-4 w-4" /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
          </span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={idx + 1} aria-valuemax={questions.length}>
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="text-sm text-muted">سؤال {idx + 1} من {questions.length}</p>

      <div className="rounded-2xl border bg-surface p-5" key={q.id}>
        <ItemInput
          item={{ t: q.type, p: q.body.prompt, o: q.body.options, w: q.body.words }}
          value={answers[q.id]}
          onChange={(v) => setAnswers({ ...answers, [q.id]: v })}
        />
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <div className="flex items-center justify-between gap-3">
        <button type="button" disabled={idx === 0} onClick={() => setIdx(idx - 1)} className={buttonStyles('secondary', 'md')}>السابق</button>
        {!last ? (
          <button type="button" onClick={() => setIdx(idx + 1)} className={buttonStyles('primary', 'md')}>التالي</button>
        ) : (
          <button type="button" disabled={submitting} onClick={submit} className={buttonStyles('primary', 'md')}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            إنهاء وإرسال ({answered}/{questions.length})
          </button>
        )}
      </div>
    </div>
  )
}

function ResultView({ result, questions, scope, passScore, backHref, backLabel }: { result: QuizResult; questions: QuizQuestion[]; scope: string; passScore: number; backHref: string; backLabel: string }) {
  const byId = new Map(questions.map((q) => [q.id, q]))
  const isPlacement = scope === 'placement'
  return (
    <div className="space-y-5">
      <div className={`rounded-2xl border p-6 text-center ${result.passed ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
        <Trophy className="mx-auto h-10 w-10 text-accent" aria-hidden />
        <p className="mt-3 text-4xl font-bold" dir="ltr">{Math.round(result.percentage)}%</p>
        <p className="mt-1 text-muted">{result.score} من {result.total} إجابات صحيحة</p>
        {isPlacement ? (
          <p className="mt-3 font-semibold">مستواك المقترح: <span dir="ltr">{result.placed_level}</span>. فُتحت لك المستويات حتى هذا المستوى.</p>
        ) : (
          <p className="mt-3 font-semibold">
            {result.passed ? 'أحسنت! اجتزت الاختبار.' : `لم تصل إلى درجة النجاح (${passScore}%). راجع الدرس وأعد المحاولة.`}
          </p>
        )}
        {result.xp_earned > 0 && <p className="mt-1 text-sm text-brand">+{result.xp_earned} نقطة خبرة</p>}
      </div>

      <h2 className="text-lg font-bold">مراجعة الإجابات</h2>
      <ol className="space-y-3">
        {result.results.map((r, i) => {
          const q = byId.get(r.id)
          return (
            <li key={r.id} className={`rounded-2xl border bg-surface p-4 ${r.correct ? 'border-emerald-500/50' : 'border-red-500/50'}`}>
              <div className="flex items-start gap-2">
                {r.correct ? <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-1 h-4 w-4 shrink-0 text-red-600" />}
                <div className="space-y-1.5 text-sm">
                  <p dir="auto" className="font-medium">{i + 1}. {q?.body.prompt}</p>
                  {!r.correct && <p>الإجابة الصحيحة: <b dir="auto">{r.correct_answer}</b></p>}
                  {r.explanation && <p className="text-fg/80">{r.explanation}</p>}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      <div className="flex flex-wrap gap-3">
        <Link href={backHref} className={buttonStyles('primary', 'md')}>{backLabel}</Link>
        <button type="button" onClick={() => window.location.reload()} className={buttonStyles('secondary', 'md')}>إعادة الاختبار</button>
      </div>
    </div>
  )
}
