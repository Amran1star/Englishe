'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Mic, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Item } from '@/lib/types'
import { useSpeech } from '@/lib/speech'
import { SCENARIOS } from '@/lib/writing-prompts'
import { SpeakButton } from '@/components/speech/speak-button'
import { SpeechControls } from '@/components/speech/speech-controls'
import { PracticeRunner } from '@/components/learn/practice-runner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Correction { original: string; corrected: string; explanation_ar: string }
interface Msg { role: 'user' | 'assistant'; content: string; corrections?: Correction[]; natural?: string | null; tip?: string | null }

export function TutorChat({ level }: { level: string }) {
  const { accent } = useSpeech()
  const [scenario, setScenario] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Item[] | null>(null)
  const [listening, setListening] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const logged = useRef(false)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])

  const call = async (body: object) => {
    const res = await fetch('/api/tutor', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const j = await res.json()
    if (!res.ok) throw new Error(j.error ?? 'تعذّر الاتصال بالمدرّس.')
    return j
  }

  const start = async (sc: string) => {
    setScenario(sc)
    setMsgs([])
    setExercises(null)
    setError(null)
    setLoading(true)
    try {
      const j = await call({ scenario: sc, messages: [] })
      setMsgs([{ role: 'assistant', content: j.reply }])
    } catch (e) {
      setError((e as Error).message)
    }
    setLoading(false)
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const history: Msg[] = [...msgs, { role: 'user', content: text }]
    setMsgs(history)
    setInput('')
    setError(null)
    setLoading(true)
    try {
      const j = await call({ scenario, messages: history.map(({ role, content }) => ({ role, content })) })
      const withFeedback = history.map((m, i) => (i === history.length - 1 ? { ...m, corrections: j.corrections, natural: j.natural_alternative, tip: j.tip_ar } : m))
      setMsgs([...withFeedback, { role: 'assistant', content: j.reply }])
      if (!logged.current) {
        logged.current = true
        createClient().rpc('log_practice', { p_type: 'tutor' }).then(() => undefined)
      }
    } catch (e) {
      setError((e as Error).message)
      setMsgs(msgs)
      setInput(text)
    }
    setLoading(false)
  }

  const allCorrections = msgs.flatMap((m) => m.corrections ?? [])
  const makeExercises = async () => {
    setLoading(true)
    setError(null)
    try {
      const j = await call({ mode: 'exercises', corrections: allCorrections })
      setExercises((j.exercises as { prompt: string; answer: string; explanation_ar: string }[]).map((x) => ({ t: 'fill', p: x.prompt, a: [x.answer], e: x.explanation_ar })))
    } catch (e) {
      setError((e as Error).message)
    }
    setLoading(false)
  }

  const dictate = () => {
    const w = window as unknown as Record<string, new () => { lang: string; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void; start: () => void }>
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) return setError('متصفحك لا يدعم الإملاء الصوتي. اكتب رسالتك.')
    const r = new SR()
    r.lang = accent === 'uk' ? 'en-GB' : 'en-US'
    r.onresult = (e) => setInput((p) => (p ? p + ' ' : '') + e.results[0][0].transcript)
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    setListening(true)
    try { r.start() } catch { setListening(false) }
  }

  if (!scenario)
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">اختر موقفاً للتدريب. يتحدث المدرّس بمستواك الحالي (<b dir="ltr">{level}</b>) ويتغير تلقائياً كلما تقدمت.</p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SCENARIOS.map((s) => (
            <li key={s.id}><button type="button" onClick={() => start(s.id)} className="h-16 w-full rounded-2xl border bg-surface font-medium hover:border-brand hover:bg-brand-soft">{s.label}</button></li>
          ))}
        </ul>
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">السيناريو: <b>{SCENARIOS.find((s) => s.id === scenario)?.label}</b> · المستوى <span dir="ltr">{level}</span></p>
        <button type="button" onClick={() => { setScenario(''); setMsgs([]) }} className="text-sm text-brand hover:underline">تغيير السيناريو</button>
      </div>
      <SpeechControls />
      <div className="space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[88%] space-y-2 rounded-2xl p-3.5 ${m.role === 'user' ? 'bg-brand text-brand-fg' : 'border bg-surface'}`}>
              <div className="flex items-start gap-2">
                {m.role === 'assistant' && <SpeakButton text={m.content} />}
                <p dir="ltr" className="leading-7">{m.content}</p>
              </div>
              {m.role === 'user' && m.corrections && m.corrections.length > 0 && (
                <div className="space-y-2 rounded-xl bg-bg p-3 text-sm text-fg">
                  {m.corrections.map((c, k) => (
                    <div key={k}><p dir="ltr"><s className="text-red-600">{c.original}</s> → <b className="text-emerald-600">{c.corrected}</b></p><p className="text-fg/80">{c.explanation_ar}</p></div>
                  ))}
                </div>
              )}
              {m.role === 'user' && m.natural && <p dir="ltr" className="rounded-xl bg-bg p-2.5 text-sm text-fg">💬 {m.natural}</p>}
              {m.role === 'user' && m.tip && <p className="rounded-xl bg-bg p-2.5 text-sm text-fg">{m.tip}</p>}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-end"><Loader2 className="h-5 w-5 animate-spin text-brand" aria-label="جارٍ الكتابة" /></div>}
        <div ref={endRef} />
      </div>
      {error && <Alert kind="error">{error}</Alert>}
      <div className="flex items-end gap-2">
        <textarea dir="ltr" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} rows={2} maxLength={1000} placeholder="Type your message..." className="min-w-0 flex-1 rounded-xl border bg-surface p-3 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25" />
        <button type="button" onClick={dictate} aria-label="إملاء صوتي" className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border bg-surface hover:bg-surface-2 ${listening ? 'text-red-600' : 'text-brand'}`}><Mic className="h-5 w-5" /></button>
        <button type="button" onClick={send} disabled={loading || !input.trim()} aria-label="إرسال" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-brand-fg disabled:opacity-50"><Send className="h-5 w-5 -scale-x-100" /></button>
      </div>
      {allCorrections.length > 0 && !exercises && <Button variant="secondary" onClick={makeExercises} loading={loading}>تمارين إضافية على أخطائي</Button>}
      {exercises && exercises.length > 0 && (
        <section className="space-y-3"><h2 className="font-bold">تمارين على نقاط ضعفك</h2><PracticeRunner items={exercises} practiceType="tutor" /></section>
      )}
    </div>
  )
}
