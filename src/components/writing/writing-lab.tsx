'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { WRITING_KINDS, WRITING_PROMPTS, type WritingKind } from '@/lib/writing-prompts'

interface Result {
  score: number
  level_estimate: string
  corrections: { original: string; corrected: string; explanation_ar: string }[]
  improved_version: string
  strengths_ar: string[]
  suggestions_ar: string[]
}

export function WritingLab() {
  const [kind, setKind] = useState<WritingKind>('sentences')
  const [prompt, setPrompt] = useState(WRITING_PROMPTS.sentences[0])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const min = WRITING_KINDS.find((k) => k.id === kind)!.min

  const pickKind = (k: WritingKind) => {
    setKind(k)
    setPrompt(WRITING_PROMPTS[k][0])
    setResult(null)
  }

  const submit = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/writing', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, prompt, text }) })
      const j = await res.json()
      if (!res.ok) setError(j.error ?? 'تعذّر التقييم.')
      else {
        setResult(j)
        createClient().rpc('log_practice', { p_type: 'writing', p_score: j.score, p_total: 100 }).then(() => undefined)
      }
    } catch {
      setError('تعذّر الاتصال بالخادم.')
    }
    setLoading(false)
  }

  const chip = (on: boolean) => `rounded-xl border px-3.5 py-2 text-sm font-medium ${on ? 'border-brand bg-brand text-brand-fg' : 'bg-surface hover:bg-surface-2'}`
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">{WRITING_KINDS.map((k) => <button key={k.id} type="button" className={chip(kind === k.id)} onClick={() => pickKind(k.id)}>{k.label}</button>)}</div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="wprompt">الموضوع</label>
        <select id="wprompt" dir="ltr" value={prompt} onChange={(e) => { setPrompt(e.target.value); setResult(null) }} className="h-11 w-full rounded-xl border bg-surface px-3">
          {WRITING_PROMPTS[kind].map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <textarea dir="ltr" value={text} onChange={(e) => setText(e.target.value)} rows={9} maxLength={4000} placeholder="Write your text here..." className="w-full rounded-xl border bg-surface p-3 text-base leading-7 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25" />
        <p className="text-xs text-muted">{words} كلمة {words < min && `— يُفضّل ${min} كلمة على الأقل لهذا النوع`}</p>
      </div>
      {error && <Alert kind="error">{error}</Alert>}
      <Button size="lg" loading={loading} disabled={text.trim().length < 10} onClick={submit}>قيّم كتابتي</Button>

      {result && (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-surface p-5 text-center">
            <p className="text-4xl font-bold" dir="ltr">{result.score}/100</p>
            <p className="text-sm text-muted">المستوى التقديري: <span dir="ltr">{result.level_estimate}</span></p>
          </div>
          {result.strengths_ar.length > 0 && <Section title="نقاط القوة" items={result.strengths_ar} />}
          {result.corrections.length > 0 && (
            <section className="space-y-2 rounded-2xl border bg-surface p-5">
              <h2 className="font-bold">التصحيحات</h2>
              <ul className="space-y-3">
                {result.corrections.map((c, i) => (
                  <li key={i} className="space-y-1 text-sm">
                    <p dir="ltr"><s className="text-red-600">{c.original}</s> → <b className="text-emerald-600">{c.corrected}</b></p>
                    <p className="text-fg/80">{c.explanation_ar}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {result.improved_version && (
            <section className="space-y-2 rounded-2xl border bg-surface p-5">
              <h2 className="font-bold">نسخة محسّنة</h2>
              <p dir="ltr" className="whitespace-pre-wrap leading-8">{result.improved_version}</p>
            </section>
          )}
          {result.suggestions_ar.length > 0 && <Section title="اقتراحات لتحسين الأسلوب" items={result.suggestions_ar} />}
        </div>
      )}
    </div>
  )
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="space-y-2 rounded-2xl border bg-surface p-5">
      <h2 className="font-bold">{title}</h2>
      <ul className="list-disc space-y-1.5 ps-5 text-sm leading-7">{items.map((s, i) => <li key={i}>{s}</li>)}</ul>
    </section>
  )
}
