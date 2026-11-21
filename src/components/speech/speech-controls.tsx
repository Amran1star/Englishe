'use client'

import { RATES, useSpeech } from '@/lib/speech'

export function SpeechControls() {
  const { supported, accent, setAccent, rate, setRate } = useSpeech()
  if (!supported) {
    return (
      <p className="rounded-xl border bg-surface p-3 text-sm text-muted">
        متصفحك لا يدعم النطق الصوتي. جرّب Chrome أو Edge أو Safari.
      </p>
    )
  }
  const chip = (on: boolean) =>
    `rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${on ? 'border-brand bg-brand text-brand-fg' : 'bg-surface hover:bg-surface-2'}`
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border bg-surface p-3" role="group" aria-label="إعدادات الصوت">
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted">اللكنة</span>
        <button type="button" className={chip(accent === 'us')} onClick={() => setAccent('us')}>أمريكية</button>
        <button type="button" className={chip(accent === 'uk')} onClick={() => setAccent('uk')}>بريطانية</button>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted">السرعة</span>
        {RATES.map((r) => (
          <button key={r} type="button" className={chip(rate === r)} onClick={() => setRate(r)} dir="ltr">{r}x</button>
        ))}
      </div>
    </div>
  )
}
