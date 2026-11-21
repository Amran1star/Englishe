'use client'

import { useId, useMemo, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useSpeech } from '@/lib/speech'

/** يعرض نصاً إنجليزياً طويلاً مع قراءة صوتية وتمييز الكلمة الجارية (إن دعم المتصفح ذلك). */
export function ReadAloud({
  text,
  onWordClick,
  hidden = false,
}: {
  text: string
  onWordClick?: (word: string) => void
  hidden?: boolean
}) {
  const id = useId()
  const { supported, activeId, speak, stop } = useSpeech()
  const [hl, setHl] = useState<{ start: number; len: number } | null>(null)
  const playing = activeId === id

  const tokens = useMemo(() => {
    const out: { s: string; start: number; word: boolean }[] = []
    const re = /\S+|\s+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) out.push({ s: m[0], start: m.index, word: /\S/.test(m[0]) })
    return out
  }, [text])

  const play = () => {
    setHl(null)
    speak(text, { id, onWord: (start, len) => setHl({ start, len }), onEnd: () => setHl(null) })
  }

  return (
    <div className="space-y-3">
      {supported && (
        <button
          type="button"
          onClick={() => (playing ? stop() : play())}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg hover:bg-brand/90"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? 'إيقاف' : 'استمع إلى النص'}
        </button>
      )}
      {!hidden && (
        <div dir="ltr" className="whitespace-pre-wrap rounded-2xl border bg-surface p-4 text-lg leading-9">
          {tokens.map((t, i) => {
            if (!t.word) return <span key={i}>{t.s}</span>
            const active = hl && t.start >= hl.start && t.start < hl.start + hl.len
            return (
              <span
                key={i}
                onClick={onWordClick ? () => onWordClick(t.s.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '')) : undefined}
                className={`rounded px-0.5 ${active ? 'bg-accent/40' : ''} ${onWordClick ? 'cursor-pointer hover:bg-brand-soft' : ''}`}
              >
                {t.s}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
