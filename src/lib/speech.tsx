'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type Accent = 'us' | 'uk'
export const RATES = [0.5, 0.75, 1, 1.25, 1.5] as const

interface SpeakOptions {
  id?: string
  onWord?: (charIndex: number, length: number) => void
  onEnd?: () => void
}

interface SpeechCtx {
  supported: boolean
  accent: Accent
  setAccent: (a: Accent) => void
  rate: number
  setRate: (r: number) => void
  activeId: string | null
  speak: (text: string, opts?: SpeakOptions) => void
  stop: () => void
}

const Ctx = createContext<SpeechCtx | null>(null)

/** يقسّم النص إلى جمل مع إزاحاتها: يتفادى توقف الصوت في النصوص الطويلة على بعض المتصفحات. */
function chunkText(text: string): { text: string; offset: number }[] {
  const chunks: { text: string; offset: number }[] = []
  const re = /[^.!?\n]+[.!?]*\s*/g
  let m: RegExpExecArray | null
  let cur: { text: string; offset: number } | null = null
  while ((m = re.exec(text)) !== null) {
    if (!cur) cur = { text: m[0], offset: m.index }
    else if (cur.text.length + m[0].length < 180) cur.text += m[0]
    else {
      chunks.push(cur)
      cur = { text: m[0], offset: m.index }
    }
  }
  if (cur) chunks.push(cur)
  return chunks.filter((c) => c.text.trim().length > 0)
}

export function SpeechProvider({ defaultAccent = 'us', children }: { defaultAccent?: Accent; children: React.ReactNode }) {
  const [supported, setSupported] = useState(false)
  const [accent, setAccentState] = useState<Accent>(defaultAccent)
  const [rate, setRateState] = useState(1)
  const [activeId, setActiveId] = useState<string | null>(null)
  const token = useRef(0)
  const voices = useRef<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    setSupported(true)
    const load = () => {
      voices.current = window.speechSynthesis.getVoices()
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    try {
      const a = localStorage.getItem('em_accent')
      if (a === 'us' || a === 'uk') setAccentState(a)
      const r = Number(localStorage.getItem('em_rate'))
      if ((RATES as readonly number[]).includes(r)) setRateState(r)
    } catch {
      /* التخزين غير متاح */
    }
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load)
      window.speechSynthesis.cancel()
    }
  }, [])

  const setAccent = useCallback((a: Accent) => {
    setAccentState(a)
    try { localStorage.setItem('em_accent', a) } catch { /* ignore */ }
  }, [])
  const setRate = useCallback((r: number) => {
    setRateState(r)
    try { localStorage.setItem('em_rate', String(r)) } catch { /* ignore */ }
  }, [])

  const stop = useCallback(() => {
    token.current++
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    setActiveId(null)
  }, [])

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) return
      window.speechSynthesis.cancel()
      const my = ++token.current
      setActiveId(opts.id ?? 'default')
      const lang = accent === 'uk' ? 'en-GB' : 'en-US'
      const all = voices.current.length ? voices.current : window.speechSynthesis.getVoices()
      const voice =
        all.find((v) => v.lang.replace('_', '-') === lang) ??
        all.find((v) => v.lang.toLowerCase().startsWith('en')) ??
        null
      const chunks = chunkText(text)
      const run = (i: number) => {
        if (my !== token.current) return
        if (i >= chunks.length) {
          setActiveId(null)
          opts.onEnd?.()
          return
        }
        const u = new SpeechSynthesisUtterance(chunks[i].text)
        u.lang = lang
        if (voice) u.voice = voice
        u.rate = rate
        u.onboundary = (e) => {
          if (my !== token.current || e.name === 'sentence') return
          const start = chunks[i].offset + e.charIndex
          const rest = text.slice(start).match(/^\S+/)
          const len = (e as unknown as { charLength?: number }).charLength
          opts.onWord?.(start, len || rest?.[0].length || 1)
        }
        u.onend = () => run(i + 1)
        u.onerror = () => {
          if (my === token.current) setActiveId(null)
        }
        window.speechSynthesis.speak(u)
      }
      run(0)
    },
    [accent, rate]
  )

  const value = useMemo(
    () => ({ supported, accent, setAccent, rate, setRate, activeId, speak, stop }),
    [supported, accent, setAccent, rate, setRate, activeId, speak, stop]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSpeech(): SpeechCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useSpeech must be used inside SpeechProvider')
  return c
}
