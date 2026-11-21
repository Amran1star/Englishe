import type { Metadata } from 'next'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { LEVELS } from '@/lib/levels'
import type { Item } from '@/lib/types'
import { OrderGame } from '@/components/learn/order-game'

export const metadata: Metadata = { title: 'القواعد' }

const TOPICS: [string, string][] = [
  ['Parts of Speech', 'أنواع الكلمات'], ['Pronouns', 'الضمائر'], ['Articles', 'أدوات التعريف والتنكير'], ['Nouns', 'الأسماء'],
  ['Adjectives', 'الصفات'], ['Adverbs', 'الظروف'], ['Prepositions', 'حروف الجر'], ['Present Simple', 'المضارع البسيط'],
  ['Present Continuous', 'المضارع المستمر'], ['Past Simple', 'الماضي البسيط'], ['Past Continuous', 'الماضي المستمر'],
  ['Present Perfect', 'المضارع التام'], ['Past Perfect', 'الماضي التام'], ['Future Tenses', 'أزمنة المستقبل'],
  ['Passive Voice', 'المبني للمجهول'], ['Conditionals', 'الجمل الشرطية'], ['Reported Speech', 'الكلام المنقول'],
  ['Modal Verbs', 'الأفعال الناقصة'], ['Relative Clauses', 'جمل الصلة'], ['Advanced Grammar', 'قواعد متقدمة'],
]

interface L { id: string; title_ar: string; grammar_topic: string; units: { level_code: string } | { level_code: string }[] }

export default async function GrammarPage() {
  const { supabase, profile } = await requireUser('/grammar')
  const [{ data: lessons }, { data: ex }] = await Promise.all([
    supabase.from('lessons').select('id, title_ar, grammar_topic, units(level_code)').not('grammar_topic', 'is', null).eq('is_published', true),
    supabase.from('exercises').select('content, lessons!inner(units!inner(level_code))').eq('type', 'order'),
  ])
  const levelOf = (l: { units: { level_code: string } | { level_code: string }[] }) => (Array.isArray(l.units) ? l.units[0] : l.units).level_code
  const byTopic = new Map<string, { id: string; title: string; level: string }[]>()
  for (const l of (lessons ?? []) as unknown as L[]) {
    byTopic.set(l.grammar_topic, [...(byTopic.get(l.grammar_topic) ?? []), { id: l.id, title: l.title_ar, level: levelOf(l) }])
  }
  const idx = (code: string) => LEVELS.findIndex((x) => x.code === code)
  const pool = ((ex ?? []) as unknown as { content: Item; lessons: { units: { level_code: string } | { level_code: string }[] } | { units: { level_code: string } | { level_code: string }[] }[] }[])
    .filter((e) => {
      const ls = Array.isArray(e.lessons) ? e.lessons[0] : e.lessons
      return idx(levelOf(ls)) <= profile.unlocked_level_index
    })
    .map((e) => e.content)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">القواعد</h1>
        <p className="mt-1 text-sm text-muted">لكل موضوع شرح عربي وأمثلة مترجمة وتمارين واختبار.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {TOPICS.map(([en, ar]) => {
          const list = (byTopic.get(en) ?? []).sort((a, b) => idx(a.level) - idx(b.level))
          return (
            <li key={en} className="rounded-2xl border bg-surface p-4">
              <p className="font-bold">{ar} <span className="text-xs font-normal text-muted" dir="ltr">· {en}</span></p>
              {list.length === 0 ? (
                <p className="mt-2 text-sm text-muted">قيد الإعداد</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {list.map((l) => {
                    const locked = idx(l.level) > profile.unlocked_level_index
                    return (
                      <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                        {locked ? <span className="flex items-center gap-1.5 text-muted"><Lock className="h-3.5 w-3.5" />{l.title}</span> : <Link href={`/lessons/${l.id}`} className="text-brand hover:underline">{l.title}</Link>}
                        <span className="rounded bg-surface-2 px-1.5 text-xs" dir="ltr">{l.level}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      <section className="space-y-3 rounded-2xl border bg-surface p-5">
        <h2 className="text-lg font-bold">لعبة ترتيب الجمل</h2>
        <OrderGame pool={pool} />
      </section>
    </div>
  )
}
