'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { Answer, Item } from '@/lib/types'
import { correctText, gradeItem } from '@/lib/text'
import { ItemInput } from './item-input'

/** تمارين بتغذية راجعة فورية (للتدريب فقط، لا تمنح نقاطاً). */
export function ExerciseRunner({ items, onFinish }: { items: Item[]; onFinish?: (correct: number, total: number) => void }) {
  const [answers, setAnswers] = useState<Record<number, Answer>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const done = items.length > 0 && Object.keys(checked).length === items.length

  const check = (i: number) => {
    const next = { ...checked, [i]: true }
    setChecked(next)
    if (Object.keys(next).length === items.length && onFinish) {
      onFinish(items.filter((it, k) => gradeItem(it, answers[k])).length, items.length)
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const isChecked = checked[i]
        const ok = isChecked && gradeItem(item, answers[i])
        return (
          <div key={i} className={`space-y-3 rounded-2xl border bg-surface p-4 ${isChecked ? (ok ? 'border-emerald-500/60' : 'border-red-500/60') : ''}`}>
            <ItemInput item={item} value={answers[i]} onChange={(v) => setAnswers({ ...answers, [i]: v })} disabled={isChecked} />
            {!isChecked ? (
              <button
                type="button"
                disabled={answers[i] === undefined || answers[i] === ''}
                onClick={() => check(i)}
                className="h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg disabled:opacity-50"
              >
                تحقّق
              </button>
            ) : (
              <div className={`flex items-start gap-2 text-sm ${ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                <div className="space-y-1">
                  <p className="font-semibold">{ok ? 'إجابة صحيحة' : <>الإجابة الصحيحة: <span dir="auto">{correctText(item)}</span></>}</p>
                  {item.e && <p className="text-fg/80">{item.e}</p>}
                  {item.src && <p className="text-xs text-muted">المصدر: {item.src}</p>}
                </div>
              </div>
            )}
          </div>
        )
      })}
      {done && <p className="text-center text-sm text-muted">أنهيت التمارين.</p>}
    </div>
  )
}
