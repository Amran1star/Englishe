'use client'

import { useRef, useState } from 'react'
import { Loader2, Mic } from 'lucide-react'
import { useSpeech } from '@/lib/speech'
import { compareSpeech } from '@/lib/text'

interface RecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

/** تسجيل صوت الطالب ومقارنته بالنص المطلوب. المقارنة تعتمد على ما يفهمه محرك التعرف على الكلام في المتصفح. */
export function Pronunciation({ target }: { target: string }) {
  const { accent } = useSpeech()
  const rec = useRef<RecognitionLike | null>(null)
  const [state, setState] = useState<'idle' | 'listening'>('idle')
  const [result, setResult] = useState<{ heard: string; score: number; words: { word: string; ok: boolean }[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const start = () => {
    setError(null)
    setResult(null)
    const w = window as unknown as Record<string, new () => RecognitionLike>
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) {
      setError('متصفحك لا يدعم التعرف على الكلام. جرّب Chrome أو Edge أو Safari.')
      return
    }
    const r = new SR()
    r.lang = accent === 'uk' ? 'en-GB' : 'en-US'
    r.interimResults = false
    r.maxAlternatives = 1
    r.onresult = (e) => {
      const heard = e.results[0][0].transcript
      const c = compareSpeech(target, heard)
      setResult({ heard, score: c.score, words: c.words })
    }
    r.onerror = (e) => {
      setError(
        e.error === 'not-allowed'
          ? 'لم يُسمح باستخدام الميكروفون. فعّل الإذن من إعدادات المتصفح.'
          : e.error === 'no-speech'
            ? 'لم نسمع صوتاً. اقترب من الميكروفون وأعد المحاولة.'
            : 'تعذّر التسجيل. أعد المحاولة.'
      )
    }
    r.onend = () => setState('idle')
    rec.current = r
    setState('listening')
    try {
      r.start()
    } catch {
      setState('idle')
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => (state === 'listening' ? rec.current?.stop() : start())}
        className="inline-flex h-9 items-center gap-2 rounded-lg border bg-surface px-3 text-sm font-medium hover:bg-surface-2"
      >
        {state === 'listening' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4 text-brand" />}
        {state === 'listening' ? 'جارٍ الاستماع… تحدّث الآن' : 'جرّب نطقها'}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {result && (
        <div className="space-y-1.5 rounded-xl border bg-surface p-3 text-sm">
          <p dir="ltr" className="flex flex-wrap gap-x-1.5">
            {result.words.map((w, i) => (
              <span key={i} className={w.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 underline dark:text-red-400'}>{w.word}</span>
            ))}
          </p>
          <p className="text-muted">
            التطابق: <b className="text-fg" dir="ltr">{result.score}%</b> — سمعنا: <span dir="ltr">{result.heard}</span>
          </p>
          <p className="text-xs text-muted">هذه مقارنة لما فهمه المتصفح من كلامك، وليست تحليلاً صوتياً دقيقاً.</p>
        </div>
      )}
    </div>
  )
}
