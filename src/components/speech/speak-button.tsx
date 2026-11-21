'use client'

import { useId } from 'react'
import { Square, Volume2 } from 'lucide-react'
import { useSpeech } from '@/lib/speech'

export function SpeakButton({ text, label, className = '' }: { text: string; label?: string; className?: string }) {
  const id = useId()
  const { supported, activeId, speak, stop } = useSpeech()
  if (!supported) return null
  const active = activeId === id
  return (
    <button
      type="button"
      onClick={() => (active ? stop() : speak(text, { id }))}
      aria-label={active ? 'إيقاف الصوت' : `استمع: ${label ?? text}`}
      className={`inline-grid h-8 w-8 shrink-0 place-items-center rounded-lg border bg-surface text-brand transition-colors hover:bg-brand-soft ${active ? 'bg-brand-soft' : ''} ${className}`}
    >
      {active ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-4 w-4" />}
    </button>
  )
}
