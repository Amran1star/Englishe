'use client'

import { useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SpeakButton } from '@/components/speech/speak-button'

export interface Word {
  id: string
  word: string
  translation_ar: string
  part_of_speech: string | null
  example_en: string | null
  example_ar: string | null
  synonyms: string[]
  antonyms: string[]
  level_code: string | null
  topic: string | null
}

export function VocabBrowser({ words, favorites }: { words: Word[]; favorites: string[] }) {
  const [fav, setFav] = useState(new Set(favorites))
  const [q, setQ] = useState('')
  const [level, setLevel] = useState('')
  const [topic, setTopic] = useState('')
  const [onlyFav, setOnlyFav] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const levels = useMemo(() => Array.from(new Set(words.map((w) => w.level_code).filter(Boolean))) as string[], [words])
  const topics = useMemo(() => Array.from(new Set(words.map((w) => w.topic).filter(Boolean))) as string[], [words])
  const shown = words.filter(
    (w) =>
      (!level || w.level_code === level) &&
      (!topic || w.topic === topic) &&
      (!onlyFav || fav.has(w.id)) &&
      (!q || w.word.toLowerCase().includes(q.toLowerCase()) || w.translation_ar.includes(q))
  )

  const toggle = async (id: string) => {
    setError(null)
    const supabase = createClient()
    const was = fav.has(id)
    const next = new Set(fav)
    was ? next.delete(id) : next.add(id)
    setFav(next)
    const { data: u } = await supabase.auth.getUser()
    const { error } = was
      ? await supabase.from('favorite_words').delete().eq('word_id', id)
      : await supabase.from('favorite_words').insert({ word_id: id, user_id: u.user?.id })
    if (error) {
      setFav(fav)
      setError('تعذّر تحديث المفضلة.')
    }
  }

  const sel = 'h-10 rounded-xl border bg-surface px-3 text-sm'
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالإنجليزية أو العربية" className={`${sel} min-w-0 flex-1`} />
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={sel} aria-label="المستوى"><option value="">كل المستويات</option>{levels.map((l) => <option key={l}>{l}</option>)}</select>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className={sel} aria-label="الموضوع"><option value="">كل المواضيع</option>{topics.map((t) => <option key={t}>{t}</option>)}</select>
        <button type="button" onClick={() => setOnlyFav(!onlyFav)} className={`${sel} ${onlyFav ? 'border-brand bg-brand-soft' : ''}`}>المفضلة</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm text-muted">{shown.length} كلمة</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {shown.map((w) => (
          <li key={w.id} className="space-y-2 rounded-2xl border bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <SpeakButton text={w.word} />
                <div>
                  <p className="text-lg font-bold" dir="ltr">{w.word} <span className="text-xs font-normal text-muted">{w.part_of_speech}</span></p>
                  <p>{w.translation_ar}</p>
                </div>
              </div>
              <button type="button" onClick={() => toggle(w.id)} aria-label={fav.has(w.id) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'} aria-pressed={fav.has(w.id)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-surface-2">
                <Heart className={`h-5 w-5 ${fav.has(w.id) ? 'fill-red-500 text-red-500' : 'text-muted'}`} />
              </button>
            </div>
            {w.example_en && (
              <div className="flex items-start gap-2 text-sm">
                <SpeakButton text={w.example_en} className="mt-0.5" />
                <div><p dir="ltr">{w.example_en}</p><p className="text-muted">{w.example_ar}</p></div>
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 text-xs text-muted" dir="ltr">
              {w.synonyms.length > 0 && <span>≈ {w.synonyms.join(', ')}</span>}
              {w.antonyms.length > 0 && <span>≠ {w.antonyms.join(', ')}</span>}
              <span className="ms-auto">{w.level_code} · {w.topic}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
