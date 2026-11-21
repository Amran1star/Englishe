import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/session'
import { LEVELS } from '@/lib/levels'
import type { Item } from '@/lib/types'
import { shuffle } from '@/lib/text'
import { SpeechControls } from '@/components/speech/speech-controls'
import { VocabBrowser, type Word } from '@/components/vocab/vocab-browser'
import { Flashcards } from '@/components/vocab/flashcards'
import { MatchGame } from '@/components/vocab/match-game'
import { PracticeRunner } from '@/components/learn/practice-runner'

export const metadata: Metadata = { title: 'المفردات' }

const TABS = [
  { id: 'browse', label: 'القاموس' },
  { id: 'review', label: 'المراجعة المتباعدة' },
  { id: 'quiz', label: 'اختبار المفردات' },
  { id: 'game', label: 'لعبة المطابقة' },
]
const COLS = 'id, word, translation_ar, part_of_speech, example_en, example_ar, synonyms, antonyms, level_code, topic'

export default async function VocabularyPage({ searchParams }: { searchParams: { tab?: string } }) {
  const { supabase, user, profile } = await requireUser('/vocabulary')
  const tab = TABS.some((t) => t.id === searchParams.tab) ? (searchParams.tab as string) : 'browse'
  const allowed: string[] = LEVELS.slice(0, profile.unlocked_level_index + 1).map((l) => l.code)

  const { data: wordsData } = await supabase.from('words').select(COLS).order('level_code').order('word')
  const words = (wordsData ?? []) as Word[]
  const unlocked = words.filter((w) => w.level_code && allowed.includes(w.level_code))

  let body: React.ReactNode = null
  if (tab === 'browse') {
    const { data: favs } = await supabase.from('favorite_words').select('word_id').eq('user_id', user.id)
    body = <VocabBrowser words={words} favorites={(favs ?? []).map((f: { word_id: string }) => f.word_id)} />
  } else if (tab === 'review') {
    const { data: rev } = await supabase.from('word_reviews').select('word_id, due_at').eq('user_id', user.id)
    const seen = new Set((rev ?? []).map((r: { word_id: string }) => r.word_id))
    const dueIds = new Set((rev ?? []).filter((r: { due_at: string }) => new Date(r.due_at) <= new Date()).map((r: { word_id: string }) => r.word_id))
    const due = words.filter((w) => dueIds.has(w.id))
    const fresh = unlocked.filter((w) => !seen.has(w.id)).slice(0, 8)
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted">{due.length} كلمة مستحقة للمراجعة، و{fresh.length} كلمة جديدة. تعيد الخوارزمية إليك الكلمة قبل أن تنساها.</p>
        <Flashcards deck={[...due, ...fresh]} />
      </div>
    )
  } else if (tab === 'quiz') {
    const picked = shuffle(unlocked).slice(0, 8)
    const items: Item[] = picked.map((w) => {
      const wrong = shuffle(unlocked.filter((x) => x.id !== w.id)).slice(0, 3).map((x) => x.translation_ar)
      const opts = shuffle([w.translation_ar, ...wrong])
      return { t: 'mcq', p: `ما معنى "${w.word}"؟`, o: opts, a: opts.indexOf(w.translation_ar), e: w.example_en ? `${w.example_en} — ${w.example_ar ?? ''}` : undefined }
    })
    body = items.length >= 4 ? <PracticeRunner items={items} practiceType="game_match" /> : <p className="text-sm text-muted">تحتاج إلى كلمات أكثر لبدء الاختبار.</p>
  } else {
    body = <MatchGame pool={unlocked} />
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">المفردات</h1>
      <SpeechControls />
      <nav className="flex flex-wrap gap-2" aria-label="أقسام المفردات">
        {TABS.map((t) => (
          <Link key={t.id} href={`/vocabulary?tab=${t.id}`} className={`rounded-xl border px-4 py-2 text-sm font-medium ${tab === t.id ? 'border-brand bg-brand text-brand-fg' : 'bg-surface hover:bg-surface-2'}`}>{t.label}</Link>
        ))}
      </nav>
      {body}
    </div>
  )
}
