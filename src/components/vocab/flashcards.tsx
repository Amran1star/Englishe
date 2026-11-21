'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SpeakButton } from '@/components/speech/speak-button'
import type { Word } from './vocab-browser'

const BTN = [
  { q: 1, label: 'مرة أخرى', cls: 'bg-red-500/15 text-red-700 dark:text-red-300' },
  { q: 2, label: 'صعب', cls: 'bg-orange-500/15 text-orange-700 dark:text-orange-300' },
  { q: 3, label: 'جيد', cls: 'bg-brand-soft text-brand' },
  { q: 4, label: 'سهل', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
]

export function Flashcards({ deck }: { deck: Word[] }) {
  const router = useRouter()
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (deck.length === 0) return <p className="rounded-2xl border bg-surface p-5 text-sm text-muted">لا توجد كلمات للمراجعة الآن. عد لاحقاً أو افتح مستويات جديدة.</p>
  if (i >= deck.length)
    return (
      <div className="space-y-3 rounded-2xl border bg-surface p-6 text-center">
        <p className="text-lg font-bold">أنهيت مراجعة اليوم</p>
        <button type="button" onClick={() => router.refresh()} className="h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg">تحديث</button>
      </div>
    )
  const w = deck[i]
  const rate = async (q: number) => {
    setBusy(true)
    setError(null)
    const { error } = await createClient().rpc('review_word', { p_word_id: w.id, p_quality: q })
    setBusy(false)
    if (error) return setError('تعذّر حفظ المراجعة. أعد المحاولة.')
    setFlipped(false)
    setI(i + 1)
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{i + 1} من {deck.length}</p>
      <div className="min-h-56 space-y-3 rounded-2xl border bg-surface p-6 text-center">
        <p className="text-3xl font-bold" dir="ltr">{w.word}</p>
        <div className="flex justify-center"><SpeakButton text={w.word} /></div>
        {flipped ? (
          <div className="space-y-2 border-t pt-3">
            <p className="text-2xl">{w.translation_ar}</p>
            {w.example_en && <p dir="ltr" className="text-sm">{w.example_en}</p>}
            {w.example_ar && <p className="text-sm text-muted">{w.example_ar}</p>}
          </div>
        ) : (
          <button type="button" onClick={() => setFlipped(true)} className="h-11 rounded-xl border px-6 font-medium hover:bg-surface-2">أظهر المعنى</button>
        )}
      </div>
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {BTN.map((b) => <button key={b.q} type="button" disabled={busy} onClick={() => rate(b.q)} className={`h-11 rounded-xl text-sm font-semibold disabled:opacity-50 ${b.cls}`}>{b.label}</button>)}
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
