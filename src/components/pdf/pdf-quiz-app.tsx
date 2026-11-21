'use client'

import { useEffect, useState } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PdfQuizRunner, type PdfQuestion, type PdfQuizSettings } from './pdf-quiz-runner'

interface Doc { id: string; file_name: string; size_bytes: number; status: string; created_at: string }
interface Past { id: string; settings: PdfQuizSettings & { difficulty: string }; questions: PdfQuestion[]; created_at: string }

const MAX = 20 * 1024 * 1024
const COUNTS = [5, 10, 20, 30, 50]
const DIFFS = [{ id: 'easy', l: 'سهل' }, { id: 'medium', l: 'متوسط' }, { id: 'hard', l: 'صعب' }]
const TYPES = [{ id: 'mcq', l: 'اختيار من متعدد' }, { id: 'tf', l: 'صح / خطأ' }, { id: 'fill', l: 'إكمال الفراغ' }, { id: 'matching', l: 'مطابقة' }, { id: 'ordering', l: 'ترتيب الكلمات' }, { id: 'short', l: 'إجابة قصيرة' }]
const CATS = [{ id: 'grammar', l: 'قواعد' }, { id: 'vocabulary', l: 'مفردات' }, { id: 'reading', l: 'فهم المقروء' }]

const mb = (n: number) => (n / 1048576).toFixed(1)

export function PdfQuizApp({ userId, initialDocs }: { userId: string; initialDocs: Doc[] }) {
  const [docs, setDocs] = useState(initialDocs)
  const [sel, setSel] = useState<string | null>(initialDocs[0]?.id ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState('medium')
  const [types, setTypes] = useState<string[]>(['mcq', 'tf', 'fill'])
  const [cats, setCats] = useState<string[]>([])
  const [minutes, setMinutes] = useState('')
  const [showAnswers, setShowAnswers] = useState<'each' | 'end'>('end')
  const [generating, setGenerating] = useState(false)
  const [past, setPast] = useState<Past[]>([])
  const [run, setRun] = useState<{ id: string; title: string; questions: PdfQuestion[]; settings: PdfQuizSettings } | null>(null)

  const doc = docs.find((d) => d.id === sel)

  useEffect(() => {
    if (!sel) return setPast([])
    createClient().from('pdf_quizzes').select('id, settings, questions, created_at').eq('document_id', sel).order('created_at', { ascending: false }).limit(10).then(({ data }) => setPast((data ?? []) as Past[]))
  }, [sel, run])

  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const upload = async (file: File | undefined) => {
    setError(null)
    setNotice(null)
    if (!file) return
    if (!(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) return setError('يُسمح بملفات PDF فقط.')
    if (file.size === 0) return setError('الملف فارغ.')
    if (file.size > MAX) return setError(`حجم الملف ${mb(file.size)}MB. الحد الأقصى 20MB.`)
    setUploading(true)
    const supabase = createClient()
    const path = `${userId}/${crypto.randomUUID()}.pdf`
    const { error: upErr } = await supabase.storage.from('pdfs').upload(path, file, { contentType: 'application/pdf', upsert: false })
    if (upErr) { setUploading(false); return setError('فشل رفع الملف. تحقق من الاتصال وأعد المحاولة.') }
    const { data, error: dbErr } = await supabase.from('pdf_documents').insert({ user_id: userId, file_name: file.name.slice(0, 200), storage_path: path, size_bytes: file.size }).select('id, file_name, size_bytes, status, created_at').single()
    setUploading(false)
    if (dbErr || !data) {
      await supabase.storage.from('pdfs').remove([path])
      return setError('تعذّر حفظ بيانات الملف.')
    }
    setDocs([data as Doc, ...docs])
    setSel(data.id)
    setNotice('تم رفع الملف. اختر إعدادات الاختبار ثم اضغط «أنشئ الاختبار».')
  }

  const remove = async (d: Doc) => {
    if (!window.confirm(`حذف الملف «${d.file_name}» واختباراته نهائياً؟`)) return
    const supabase = createClient()
    const { data } = await supabase.from('pdf_documents').select('storage_path').eq('id', d.id).single()
    if (data) await supabase.storage.from('pdfs').remove([data.storage_path])
    await supabase.from('pdf_documents').delete().eq('id', d.id)
    const rest = docs.filter((x) => x.id !== d.id)
    setDocs(rest)
    if (sel === d.id) setSel(rest[0]?.id ?? null)
  }

  const generate = async () => {
    if (!sel) return
    setError(null)
    setNotice(null)
    setGenerating(true)
    try {
      const res = await fetch('/api/pdf/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ documentId: sel, count, difficulty, types, categories: cats, timeLimitMinutes: minutes ? Number(minutes) : null, showAnswers }) })
      const j = await res.json()
      if (!res.ok) setError(j.error ?? 'تعذّر إنشاء الاختبار.')
      else {
        if (j.short) setNotice(`الملف لا يحتوي مادة كافية لـ ${count} سؤالاً، فأُنشئ ${j.questions.length} سؤالاً فقط (لا نختلق معلومات).`)
        setRun({ id: j.id, title: doc?.file_name ?? 'اختبار', questions: j.questions, settings: j.settings })
      }
    } catch {
      setError('تعذّر الاتصال بالخادم.')
    }
    setGenerating(false)
  }

  if (run) return <PdfQuizRunner quizId={run.id} title={run.title} questions={run.questions} settings={run.settings} onExit={() => setRun(null)} onNew={() => setRun(null)} />

  const chip = (on: boolean) => `rounded-xl border px-3 py-2 text-sm font-medium ${on ? 'border-brand bg-brand text-brand-fg' : 'bg-surface hover:bg-surface-2'}`
  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border bg-surface p-5">
        <h2 className="font-bold">1. ارفع ملف PDF</h2>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center hover:bg-surface-2">
          <Upload className="h-6 w-6 text-brand" aria-hidden />
          <span className="text-sm">{uploading ? 'جارٍ الرفع…' : 'اضغط لاختيار ملف PDF (حتى 20MB)'}</span>
          <input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={uploading} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        <p className="text-xs text-muted">ملفاتك خاصة بك ولا يراها مستخدم آخر. يُقرأ الملف (نصاً أو صوراً ممسوحة ضوئياً) بواسطة نموذج الذكاء الاصطناعي لبناء الأسئلة.</p>
      </section>

      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="info">{notice}</Alert>}

      {docs.length > 0 && (
        <section className="space-y-3 rounded-2xl border bg-surface p-5">
          <h2 className="font-bold">2. اختر الملف</h2>
          <ul className="space-y-2">
            {docs.map((d) => (
              <li key={d.id} className={`flex items-center gap-3 rounded-xl border p-3 ${sel === d.id ? 'border-brand bg-brand-soft' : ''}`}>
                <button type="button" onClick={() => setSel(d.id)} className="flex min-w-0 flex-1 items-center gap-3 text-start">
                  <FileText className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                  <span className="min-w-0"><span className="block truncate text-sm font-medium" dir="auto">{d.file_name}</span><span className="text-xs text-muted">{mb(d.size_bytes)}MB</span></span>
                </button>
                <button type="button" onClick={() => remove(d)} aria-label="حذف الملف" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {doc && (
        <section className="space-y-4 rounded-2xl border bg-surface p-5">
          <h2 className="font-bold">3. إعدادات الاختبار</h2>
          <Group label="عدد الأسئلة">{COUNTS.map((c) => <button key={c} type="button" className={chip(count === c)} onClick={() => setCount(c)}>{c}</button>)}</Group>
          <Group label="الصعوبة">{DIFFS.map((d) => <button key={d.id} type="button" className={chip(difficulty === d.id)} onClick={() => setDifficulty(d.id)}>{d.l}</button>)}</Group>
          <Group label="أنواع الأسئلة">{TYPES.map((t) => <button key={t.id} type="button" className={chip(types.includes(t.id))} onClick={() => toggle(types, setTypes, t.id)}>{t.l}</button>)}</Group>
          <Group label="التركيز (اختياري)">{CATS.map((t) => <button key={t.id} type="button" className={chip(cats.includes(t.id))} onClick={() => toggle(cats, setCats, t.id)}>{t.l}</button>)}</Group>
          <Group label="إظهار الإجابة">
            <button type="button" className={chip(showAnswers === 'each')} onClick={() => setShowAnswers('each')}>بعد كل سؤال</button>
            <button type="button" className={chip(showAnswers === 'end')} onClick={() => setShowAnswers('end')}>في النهاية</button>
          </Group>
          <div className="space-y-1.5">
            <label htmlFor="mins" className="text-sm font-medium">مدة الاختبار بالدقائق (اختياري)</label>
            <input id="mins" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, '').slice(0, 3))} className="h-11 w-32 rounded-xl border bg-surface px-3" dir="ltr" />
          </div>
          <Button size="lg" loading={generating} disabled={types.length === 0} onClick={generate}>{generating ? 'جارٍ إنشاء الاختبار… قد يستغرق دقيقة' : 'أنشئ الاختبار'}</Button>
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3 rounded-2xl border bg-surface p-5">
          <h2 className="font-bold">اختبارات سابقة لهذا الملف</h2>
          <ul className="divide-y">
            {past.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{new Date(p.created_at).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' })} · {p.questions.length} سؤالاً</span>
                <Button size="md" variant="secondary" onClick={() => setRun({ id: p.id, title: doc?.file_name ?? 'اختبار', questions: p.questions, settings: { ...p.settings, showAnswers: p.settings.showAnswers ?? 'end' } })}>إعادة الاختبار</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
