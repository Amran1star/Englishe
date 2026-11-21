'use client'

import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import type { Answer, Item } from '@/lib/types'
import { shuffle } from '@/lib/text'

type Props = {
  item: Pick<Item, 't' | 'p' | 'o' | 'w' | 'pairs'>
  value: Answer | undefined
  onChange: (v: Answer) => void
  disabled?: boolean
}

const opt = (on: boolean, disabled?: boolean) =>
  `w-full rounded-xl border px-4 py-3 text-start transition-colors ${on ? 'border-brand bg-brand-soft font-semibold' : 'bg-surface hover:bg-surface-2'} ${disabled ? 'pointer-events-none opacity-80' : ''}`

export function ItemInput({ item, value, onChange, disabled }: Props) {
  return (
    <div className="space-y-3">
      <p dir="auto" className="text-lg font-medium leading-8">{item.p}</p>
      {item.t === 'mcq' && (
        <div className="space-y-2">
          {(item.o ?? []).map((o, i) => (
            <button key={i} type="button" dir="auto" className={opt(value === i, disabled)} onClick={() => onChange(i)}>{o}</button>
          ))}
        </div>
      )}
      {item.t === 'tf' && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={opt(value === true, disabled)} onClick={() => onChange(true)}>صح</button>
          <button type="button" className={opt(value === false, disabled)} onClick={() => onChange(false)}>خطأ</button>
        </div>
      )}
      {(item.t === 'fill' || item.t === 'short') && (
        <input
          dir="ltr"
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="اكتب إجابتك"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="h-12 w-full rounded-xl border bg-surface px-4 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
        />
      )}
      {item.t === 'order' && <OrderInput words={item.w ?? []} onChange={onChange} disabled={disabled} />}
      {item.t === 'matching' && <MatchingInput pairs={item.pairs ?? []} value={value} onChange={onChange} disabled={disabled} />}
    </div>
  )
}

function OrderInput({ words, onChange, disabled }: { words: string[]; onChange: (v: Answer) => void; disabled?: boolean }) {
  const [picked, setPicked] = useState<number[]>([])
  const update = (next: number[]) => {
    setPicked(next)
    onChange(next.map((i) => words[i]).join(' '))
  }
  return (
    <div className="space-y-3" dir="ltr">
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-dashed bg-surface p-2">
        {picked.length === 0 && <span className="px-2 text-sm text-muted">اضغط على الكلمات بالترتيب</span>}
        {picked.map((i, k) => (
          <span key={k} className="rounded-lg bg-brand px-3 py-1.5 text-brand-fg">{words[i]}</span>
        ))}
        {picked.length > 0 && !disabled && (
          <button type="button" onClick={() => update([])} aria-label="مسح" className="ms-auto grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2">
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {words.map((w, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled || picked.includes(i)}
            onClick={() => update([...picked, i])}
            className="rounded-lg border bg-surface px-3 py-1.5 hover:bg-surface-2 disabled:opacity-30"
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  )
}

function MatchingInput({ pairs, value, onChange, disabled }: { pairs: { left: string; right: string }[]; value: Answer | undefined; onChange: (v: Answer) => void; disabled?: boolean }) {
  const rights = useMemo(() => shuffle(pairs.map((p) => p.right)), [pairs])
  const current: Record<string, string> = typeof value === 'object' && value !== null ? value : {}
  return (
    <div className="space-y-2" dir="ltr">
      {pairs.map((p) => (
        <div key={p.left} className="flex items-center gap-3">
          <span className="w-1/2 rounded-lg border bg-surface px-3 py-2">{p.left}</span>
          <select
            disabled={disabled}
            value={current[p.left] ?? ''}
            onChange={(e) => onChange({ ...current, [p.left]: e.target.value })}
            className="h-11 w-1/2 rounded-lg border bg-surface px-2"
          >
            <option value="">—</option>
            {rights.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}
