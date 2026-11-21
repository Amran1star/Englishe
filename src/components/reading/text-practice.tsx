'use client'

import { useState } from 'react'
import { Eye, Languages, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Item } from '@/lib/types'
import { ReadAloud } from '@/components/speech/read-aloud'
import { SpeechControls } from '@/components/speech/speech-controls'
import { SpeakButton } from '@/components/speech/speak-button'
import { PracticeRunner } from '@/components/learn/practice-runner'

interface Lookup { word: string; tr?: string; pos?: string | null; loading?: boolean; err?: string }

export function TextPractice({ body, bodyAr, items, mode }: { body: string; bodyAr: string | null; items: Item[]; mode: 'read' | 'listen' }) {
  const [revealed, setRevealed] = useState(mode === 'read')
  const [showAr, setShowAr] = useState(false)
  const [lk, setLk] = useState<Lookup | null>(null)

  const lookup = async (raw: string) => {
    const w = raw.toLowerCase()
    if (!w) return
    setLk({ word: w, loading: true })
    const cands = Array.from(new Set([w, w.replace(/(ing|ed|es|s)$/, '')])).filter(Boolean)
    const { data } = await createClient().from('words').select('word, translation_ar, part_of_speech').in('word', cands).limit(1)
    if (data && data.length > 0) return setLk({ word: data[0].word, tr: data[0].translation_ar, pos: data[0].part_of_speech })
    try {
      const res = await fetch('/api/translate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ word: w }) })
      const j = await res.json()
      setLk(res.ok ? { word: w, tr: j.translation_ar, pos: j.pos } : { word: w, err: j.error ?? 'تعذّرت الترجمة.' })
    } catch {
      setLk({ word: w, err: 'تعذّرت الترجمة. تحقق من الاتصال.' })
    }
  }

  return (
    <div className="space-y-5">
      <SpeechControls />
      {mode === 'listen' && !revealed && (
        <p className="rounded-xl bg-brand-soft p-3 text-sm">استمع أولاً (يمكنك الإعادة وتغيير السرعة)، ثم أجب عن الأسئلة، ثم اكشف النص للتحقق.</p>
      )}
      <ReadAloud text={body} hidden={!revealed} onWordClick={revealed ? lookup : undefined} />
      {mode === 'listen' && !revealed && (
        <button type="button" onClick={() => setRevealed(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border bg-surface px-4 text-sm font-medium hover:bg-surface-2"><Eye className="h-4 w-4" />اكشف النص</button>
      )}
      {revealed && <p className="text-sm text-muted">اضغط على أي كلمة لترجمتها.</p>}
      {lk && (
        <div className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand-soft p-3" role="status">
          {lk.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SpeakButton text={lk.word} />}
          <span dir="ltr" className="font-bold">{lk.word}</span>
          {lk.tr && <span>— {lk.tr} {lk.pos && <span className="text-xs text-muted" dir="ltr">({lk.pos})</span>}</span>}
          {lk.err && <span className="text-sm text-red-600">{lk.err}</span>}
        </div>
      )}
      {revealed && bodyAr && (
        <div>
          <button type="button" onClick={() => setShowAr(!showAr)} className="inline-flex h-9 items-center gap-2 rounded-lg border bg-surface px-3 text-sm hover:bg-surface-2"><Languages className="h-4 w-4" />{showAr ? 'إخفاء الترجمة' : 'عرض الترجمة العربية'}</button>
          {showAr && <p className="mt-2 whitespace-pre-wrap rounded-xl border bg-surface p-4 leading-8">{bodyAr}</p>}
        </div>
      )}
      {items.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">أسئلة الفهم</h2>
          <PracticeRunner items={items} practiceType={mode === 'read' ? 'reading' : 'listening'} />
        </section>
      )}
    </div>
  )
}
