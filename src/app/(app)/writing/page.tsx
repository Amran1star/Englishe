import type { Metadata } from 'next'
import { requireUser } from '@/lib/session'
import { WritingLab } from '@/components/writing/writing-lab'

export const metadata: Metadata = { title: 'الكتابة' }

interface Sub { id: string; kind: string; prompt: string; score: number | null; created_at: string }
const KIND_AR: Record<string, string> = { sentences: 'جمل', paragraph: 'فقرة', letter: 'رسالة', email: 'بريد', essay: 'مقال' }

export default async function WritingPage() {
  const { supabase, user } = await requireUser('/writing')
  const { data } = await supabase.from('writing_submissions').select('id, kind, prompt, score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
  const subs = (data ?? []) as Sub[]
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الكتابة</h1>
        <p className="mt-1 text-sm text-muted">اكتب بالإنجليزية واحصل على تقييم وتصحيح وشرح عربي لأخطائك.</p>
      </div>
      <WritingLab />
      {subs.length > 0 && (
        <section className="space-y-2 rounded-2xl border bg-surface p-5">
          <h2 className="font-bold">آخر محاولاتك</h2>
          <ul className="divide-y text-sm">
            {subs.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate" dir="ltr">{KIND_AR[s.kind] ?? s.kind}: {s.prompt}</span>
                <b className="shrink-0" dir="ltr">{s.score ?? '-'}/100</b>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
