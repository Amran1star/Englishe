'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock, Download, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Answer, Item } from '@/lib/types'
import { correctText, gradeItem } from '@/lib/text'
import { ItemInput } from '@/components/learn/item-input'
import { Button } from '@/components/ui/button'

export interface PdfQuestion extends Item { cat?: string }
export interface PdfQuizSettings { count: number; difficulty: string; timeLimitMinutes: number | null; showAnswers: 'each' | 'end' }

export function PdfQuizRunner({ quizId, title, questions, settings, onExit, onNew }: { quizId: string; title: string; questions: PdfQuestion[]; settings: PdfQuizSettings; onExit: () => void; onNew: () => void }) {
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Record<number, Answer>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [finished, setFinished] = useState(false)
  const [left, setLeft] = useState<number | null>(settings.timeLimitMinutes ? settings.timeLimitMinutes * 60 : null)
  const started = useRef(Date.now())
  const saved = useRef(false)

  const score = questions.filter((q, k) => gradeItem(q, answers[k])).length

  const finish = async () => {
    setFinished(true)
    if (saved.current) return
    saved.current = true
    const supabase = createClient()
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('pdf_quiz_attempts').insert({
      user_id: u.user?.id, pdf_quiz_id: quizId, score, total: questions.length,
      answers: questions.map((q, k) => ({ p: q.p, correct: gradeItem(q, answers[k]), your: answers[k] ?? null })),
      duration_seconds: Math.round((Date.now() - started.current) / 1000),
    })
    supabase.rpc('log_practice', { p_type: 'pdf_quiz', p_score: score, p_total: questions.length }).then(() => undefined)
  }

  useEffect(() => {
    if (left === null || finished) return
    if (left <= 0) { finish(); return }
    const t = setTimeout(() => setLeft((l) => (l === null ? l : l - 1)), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, finished])

  const download = () => {
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)
    const rows = questions.map((q, k) => {
      const ok = gradeItem(q, answers[k])
      return `<li style="margin-bottom:14px"><b>${esc(q.p)}</b><br>${ok ? '✔ صحيحة' : '✘ خاطئة'} — الإجابة الصحيحة: ${esc(correctText(q))}${q.e ? `<br><small>${esc(q.e)}</small>` : ''}${q.src ? `<br><small>المصدر: ${esc(q.src)}</small>` : ''}</li>`
    }).join('')
    const html = `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>${esc(title)}</title><body style="font-family:sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem"><h1>${esc(title)}</h1><p>النتيجة: ${score} / ${questions.length}</p><ol>${rows}</ol></body></html>`
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'quiz-result.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (finished)
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border bg-surface p-6 text-center">
          <p className="text-4xl font-bold" dir="ltr">{Math.round((score / questions.length) * 100)}%</p>
          <p className="text-muted">{score} من {questions.length}</p>
        </div>
        <ol className="space-y-3">
          {questions.map((q, k) => {
            const ok = gradeItem(q, answers[k])
            return (
              <li key={k} className={`rounded-2xl border bg-surface p-4 text-sm ${ok ? 'border-emerald-500/50' : 'border-red-500/50'}`}>
                <div className="flex items-start gap-2">
                  {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
                  <div className="space-y-1">
                    <p dir="auto" className="font-medium">{k + 1}. {q.p}</p>
                    {!ok && <p>الإجابة الصحيحة: <b dir="auto">{correctText(q)}</b></p>}
                    {q.e && <p className="text-fg/80">{q.e}</p>}
                    {q.src && <p className="text-xs text-muted">المصدر: {q.src}</p>}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button onClick={download} variant="secondary"><Download className="h-4 w-4" />تنزيل النتيجة</Button>
          <Button onClick={() => window.location.reload()} variant="secondary">إعادة الاختبار نفسه</Button>
          <Button onClick={onNew}>اختبار جديد من نفس الملف</Button>
          <Button onClick={onExit} variant="ghost">رجوع</Button>
        </div>
      </div>
    )

  const q = questions[i]
  const isChecked = checked[i]
  const ok = isChecked && gradeItem(q, answers[i])
  const last = i === questions.length - 1
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{title}</h1>
        {left !== null && <span className="inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-1.5 text-sm" dir="ltr"><Clock className="h-4 w-4" />{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((i + 1) / questions.length) * 100}%` }} /></div>
      <p className="text-sm text-muted">سؤال {i + 1} من {questions.length}</p>
      <div className="space-y-3 rounded-2xl border bg-surface p-5" key={i}>
        <ItemInput item={q} value={answers[i]} onChange={(v) => setAnswers({ ...answers, [i]: v })} disabled={isChecked} />
        {settings.showAnswers === 'each' && !isChecked && <Button size="md" disabled={answers[i] === undefined} onClick={() => setChecked({ ...checked, [i]: true })}>تحقّق</Button>}
        {isChecked && (
          <div className={`text-sm ${ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
            <p className="font-semibold">{ok ? 'إجابة صحيحة' : <>الصحيح: <span dir="auto">{correctText(q)}</span></>}</p>
            {q.e && <p className="text-fg/80">{q.e}</p>}
            {q.src && <p className="text-xs text-muted">المصدر: {q.src}</p>}
          </div>
        )}
      </div>
      <div className="flex justify-between gap-3">
        <Button variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}>السابق</Button>
        {!last ? <Button onClick={() => setI(i + 1)} disabled={settings.showAnswers === 'each' && !isChecked}>التالي</Button> : <Button onClick={finish}>إنهاء وعرض النتيجة</Button>}
      </div>
    </div>
  )
}
