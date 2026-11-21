'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Answer, Item } from '@/lib/types'
import { correctText, gradeItem, shuffle } from '@/lib/text'
import { ItemInput } from './item-input'

const ROUNDS = 5

export function OrderGame({ pool }: { pool: Item[] }) {
  const rounds = useMemo(() => shuffle(pool).slice(0, ROUNDS), [pool])
  const [i, setI] = useState(0)
  const [value, setValue] = useState<Answer | undefined>()
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  if (rounds.length === 0) return <p className="text-sm text-muted">لا توجد جمل متاحة للعب بعد.</p>
  if (done)
    return (
      <div className="space-y-3 text-center">
        <p className="text-xl font-bold">نتيجتك: {score} من {rounds.length}</p>
        <button type="button" onClick={() => window.location.reload()} className="h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg">العب مرة أخرى</button>
      </div>
    )
  const item = rounds[i]
  const ok = checked && gradeItem(item, value)

  const next = () => {
    if (i + 1 >= rounds.length) {
      setDone(true)
      createClient().rpc('log_practice', { p_type: 'game_order', p_score: score, p_total: rounds.length }).then(() => undefined)
      return
    }
    setI(i + 1)
    setValue(undefined)
    setChecked(false)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">الجولة {i + 1} من {rounds.length}</p>
      <ItemInput key={i} item={item} value={value} onChange={setValue} disabled={checked} />
      {!checked ? (
        <button type="button" disabled={!value} onClick={() => { setChecked(true); if (gradeItem(item, value)) setScore(score + 1) }} className="h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg disabled:opacity-50">تحقّق</button>
      ) : (
        <div className="space-y-2">
          <p className={ok ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>{ok ? 'صحيح!' : <>الصحيح: <span dir="ltr">{correctText(item)}</span></>}</p>
          <button type="button" onClick={next} className="h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg">{i + 1 >= rounds.length ? 'إنهاء' : 'التالي'}</button>
        </div>
      )}
    </div>
  )
}
