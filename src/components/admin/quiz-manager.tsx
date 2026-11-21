'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LEVELS } from '@/lib/levels'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Quiz { id: string; title_ar: string; scope: string; level_code: string | null; lesson_id: string | null; is_published: boolean }
interface Lesson { id: string; title_ar: string; level_code: string }
interface Q { id: string; type: string; body: { prompt: string; options?: string[]; words?: string[] }; answer_key: { answer?: unknown; answers?: string[] }; explanation_ar: string | null; sort_order: number }

const inp = 'h-10 w-full rounded-lg border bg-surface px-3 text-sm'

export function QuizManager({ initialQuizzes, lessons }: { initialQuizzes: Quiz[]; lessons: Lesson[] }) {
  const supabase = createClient()
  const [quizzes, setQuizzes] = useState(initialQuizzes)
  const [sel, setSel] = useState<Quiz | null>(null)
  const [qs, setQs] = useState<Q[]>([])
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [nq, setNq] = useState({ title_ar: '', lesson_id: '' })
  const [f, setF] = useState({ type: 'mcq', prompt: '', options: '', correct: '1', tf: 'true', answers: '', words: '', sentence: '', explanation: '' })

  const bad = (t: string) => setMsg({ kind: 'error', text: t })
  const ok = (t: string) => setMsg({ kind: 'success', text: t })

  const open = async (q: Quiz) => {
    setSel(q)
    setMsg(null)
    const { data, error } = await supabase.rpc('admin_get_questions', { p_quiz_id: q.id })
    if (error) return bad('تعذّر تحميل الأسئلة.')
    setQs(data as Q[])
  }

  const createQuiz = async () => {
    const lesson = lessons.find((l) => l.id === nq.lesson_id)
    if (!lesson || !nq.title_ar.trim()) return bad('اختر الدرس واكتب عنوان الاختبار.')
    const { data, error } = await supabase.from('quizzes').insert({ scope: 'lesson', lesson_id: lesson.id, level_code: lesson.level_code, title_ar: nq.title_ar, is_published: false })
      .select('id, title_ar, scope, level_code, lesson_id, is_published').single()
    if (error || !data) return bad('تعذّر إنشاء الاختبار.')
    setQuizzes([data as Quiz, ...quizzes])
    setNq({ title_ar: '', lesson_id: '' })
    ok('أُنشئ الاختبار (غير منشور). أضف له أسئلة ثم انشره.')
  }

  const togglePublish = async (q: Quiz, v: boolean) => {
    const { error } = await supabase.from('quizzes').update({ is_published: v }).eq('id', q.id)
    if (error) return bad('تعذّر التحديث.')
    setQuizzes(quizzes.map((x) => (x.id === q.id ? { ...x, is_published: v } : x)))
    if (sel?.id === q.id) setSel({ ...q, is_published: v })
  }

  const addQuestion = async () => {
    if (!sel) return
    const prompt = f.prompt.trim()
    if (!prompt) return bad('اكتب نص السؤال.')
    let body: object
    let key: object
    if (f.type === 'mcq') {
      const options = f.options.split('\n').map((s) => s.trim()).filter(Boolean)
      const idx = Number(f.correct) - 1
      if (options.length < 2 || !(idx >= 0 && idx < options.length)) return bad('أدخل خيارين على الأقل (سطر لكل خيار) ورقم الإجابة الصحيحة ضمنها.')
      body = { prompt, options }
      key = { answer: idx }
    } else if (f.type === 'tf') {
      body = { prompt }
      key = { answer: f.tf === 'true' }
    } else if (f.type === 'fill') {
      const answers = f.answers.split('\n').map((s) => s.trim()).filter(Boolean)
      if (answers.length === 0) return bad('أدخل إجابة مقبولة واحدة على الأقل.')
      body = { prompt }
      key = { answers }
    } else {
      const words = f.words.trim().split(/\s+/).filter(Boolean)
      if (words.length < 2 || !f.sentence.trim()) return bad('أدخل الكلمات مبعثرة والجملة الصحيحة.')
      body = { prompt, words }
      key = { answer: f.sentence.trim() }
    }
    const { error } = await supabase.from('questions').insert({
      quiz_id: sel.id, type: f.type, body, answer_key: key, explanation_ar: f.explanation.trim() || null, sort_order: qs.length + 1, level_code: sel.level_code,
    })
    if (error) return bad('تعذّرت إضافة السؤال.')
    setF({ ...f, prompt: '', options: '', answers: '', words: '', sentence: '', explanation: '' })
    await open(sel)
    ok('أُضيف السؤال.')
  }

  const del = async (id: string) => {
    if (!sel || !window.confirm('حذف السؤال؟')) return
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) return bad('تعذّر الحذف.')
    setQs(qs.filter((q) => q.id !== id))
  }

  const shownAnswer = (q: Q) => (q.type === 'mcq' ? q.body.options?.[Number(q.answer_key.answer)] : q.type === 'fill' ? q.answer_key.answers?.join(' / ') : String(q.answer_key.answer))

  return (
    <div className="space-y-5">
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <section className="space-y-3 rounded-2xl border bg-surface p-5">
        <h2 className="font-bold">إنشاء اختبار لدرس</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <select className={inp} value={nq.lesson_id} onChange={(e) => setNq({ ...nq, lesson_id: e.target.value })}><option value="">اختر الدرس</option>{lessons.map((l) => <option key={l.id} value={l.id}>{l.level_code} · {l.title_ar}</option>)}</select>
          <input className={inp} placeholder="عنوان الاختبار" value={nq.title_ar} onChange={(e) => setNq({ ...nq, title_ar: e.target.value })} />
        </div>
        <Button variant="secondary" onClick={createQuiz}>إنشاء</Button>
      </section>

      <section className="rounded-2xl border bg-surface p-5">
        <h2 className="mb-3 font-bold">الاختبارات</h2>
        <ul className="divide-y text-sm">
          {quizzes.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <button type="button" className={`text-start hover:text-brand ${sel?.id === q.id ? 'font-bold text-brand' : ''}`} onClick={() => open(q)}>{q.title_ar} <span className="text-xs text-muted" dir="ltr">({q.scope}{q.level_code ? ` · ${q.level_code}` : ''})</span></button>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={q.is_published} onChange={(e) => togglePublish(q, e.target.checked)} />منشور</label>
            </li>
          ))}
        </ul>
      </section>

      {sel && (
        <section className="space-y-4 rounded-2xl border border-brand/50 bg-surface p-5">
          <h2 className="font-bold">أسئلة: {sel.title_ar} ({qs.length})</h2>
          {sel.scope !== 'lesson' && <p className="text-xs text-muted">اختبارات الوحدة والمستوى وتحديد المستوى مولَّدة من أسئلة الدروس؛ تعديلها هنا يؤثر على هذا الاختبار فقط.</p>}
          <ol className="space-y-2 text-sm">
            {qs.map((q, i) => (
              <li key={q.id} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                <div><p dir="auto" className="font-medium">{i + 1}. {q.body.prompt} <span className="text-xs text-muted">({q.type})</span></p><p className="text-emerald-700 dark:text-emerald-300">الإجابة: <span dir="auto">{shownAnswer(q)}</span></p></div>
                <button type="button" onClick={() => del(q.id)} className="shrink-0 text-red-600 hover:underline">حذف</button>
              </li>
            ))}
          </ol>

          <div className="space-y-2 border-t pt-4">
            <h3 className="font-semibold">إضافة سؤال</h3>
            <select className={inp} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              <option value="mcq">اختيار من متعدد</option><option value="tf">صح / خطأ</option><option value="fill">إكمال الفراغ</option><option value="order">ترتيب الكلمات</option>
            </select>
            <input className={inp} dir="auto" placeholder="نص السؤال" value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} />
            {f.type === 'mcq' && (<>
              <textarea dir="auto" rows={4} className="w-full rounded-lg border bg-surface p-3 text-sm" placeholder="الخيارات (سطر لكل خيار)" value={f.options} onChange={(e) => setF({ ...f, options: e.target.value })} />
              <input className={inp} inputMode="numeric" placeholder="رقم الخيار الصحيح (1 = الأول)" value={f.correct} onChange={(e) => setF({ ...f, correct: e.target.value.replace(/\D/g, '') })} />
            </>)}
            {f.type === 'tf' && <select className={inp} value={f.tf} onChange={(e) => setF({ ...f, tf: e.target.value })}><option value="true">الإجابة: صح</option><option value="false">الإجابة: خطأ</option></select>}
            {f.type === 'fill' && <textarea dir="ltr" rows={3} className="w-full rounded-lg border bg-surface p-3 text-sm" placeholder="الإجابات المقبولة (سطر لكل إجابة)" value={f.answers} onChange={(e) => setF({ ...f, answers: e.target.value })} />}
            {f.type === 'order' && (<>
              <input className={inp} dir="ltr" placeholder="الكلمات مبعثرة مفصولة بمسافات" value={f.words} onChange={(e) => setF({ ...f, words: e.target.value })} />
              <input className={inp} dir="ltr" placeholder="الجملة الصحيحة (بلا علامات ترقيم)" value={f.sentence} onChange={(e) => setF({ ...f, sentence: e.target.value })} />
            </>)}
            <input className={inp} placeholder="شرح الإجابة بالعربية" value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} />
            <Button onClick={addQuestion}>إضافة السؤال</Button>
          </div>
        </section>
      )}
    </div>
  )
}
