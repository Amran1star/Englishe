'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { shuffle } from '@/lib/text'
import type { Word } from './vocab-browser'

export function MatchGame({ pool }: { pool: Word[] }) {
  const round = useMemo(() => shuffle(pool).slice(0, 6), [pool])
  const rights = useMemo(() => shuffle(round), [round])
  const [left, setLeft] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState(0)
  const [logged, setLogged] = useState(false)

  if (round.length < 4) return <p className="text-sm text-muted">تحتاج إلى 4 كلمات على الأقل لبدء اللعبة.</p>

  const pickRight = (id: string) => {
    if (!left || matched.has(id)) return
    if (left === id) {
      const next = new Set(matched).add(id)
      setMatched(next)
      setLeft(null)
      if (next.size === round.length && !logged) {
        setLogged(true)
        createClient().rpc('log_practice', { p_type: 'game_match', p_score: round.length, p_total: round.length + wrong }).then(() => undefined)
      }
    } else {
      setWrong(wrong + 1)
      setLeft(null)
    }
  }
  const finished = matched.size === round.length
  const base = 'w-full rounded-xl border px-3 py-3 text-center transition-colors'
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">اضغط على كلمة إنجليزية ثم على معناها. أخطاؤك: {wrong}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2" dir="ltr">
          {round.map((w) => <button key={w.id} type="button" disabled={matched.has(w.id)} onClick={() => setLeft(w.id)} className={`${base} ${matched.has(w.id) ? 'border-emerald-500 bg-emerald-500/10 opacity-60' : left === w.id ? 'border-brand bg-brand-soft' : 'bg-surface hover:bg-surface-2'}`}>{w.word}</button>)}
        </div>
        <div className="space-y-2">
          {rights.map((w) => <button key={w.id} type="button" disabled={matched.has(w.id)} onClick={() => pickRight(w.id)} className={`${base} ${matched.has(w.id) ? 'border-emerald-500 bg-emerald-500/10 opacity-60' : 'bg-surface hover:bg-surface-2'}`}>{w.translation_ar}</button>)}
        </div>
      </div>
      {finished && (
        <div className="space-y-2 text-center">
          <p className="font-bold text-emerald-600">أحسنت! أكملت اللعبة.</p>
          <button type="button" onClick={() => window.location.reload()} className="h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg">العب مرة أخرى</button>
        </div>
      )}
    </div>
  )
}
