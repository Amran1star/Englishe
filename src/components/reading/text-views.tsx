import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Headphones, Lock, BookOpen } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { LEVELS } from '@/lib/levels'
import type { Item } from '@/lib/types'
import { TextPractice } from './text-practice'

const KIND_AR: Record<string, string> = { story: 'قصة', lesson_text: 'نص تعليمي', article: 'مقال', dialogue: 'حوار' }

interface T { id: string; kind: string; level_code: string; title_en: string; title_ar: string }

/** قائمة النصوص: القراءة لا تشمل الحوارات، والاستماع يشمل كل الأنواع. */
export async function TextList({ mode }: { mode: 'read' | 'listen' }) {
  const base = mode === 'read' ? '/reading' : '/listening'
  const { supabase, profile } = await requireUser(base)
  const q = supabase.from('texts').select('id, kind, level_code, title_en, title_ar').eq('is_published', true).order('sort_order')
  const { data } = await (mode === 'read' ? q.neq('kind', 'dialogue') : q)
  const texts = (data ?? []) as T[]
  const Icon = mode === 'read' ? BookOpen : Headphones
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{mode === 'read' ? 'القراءة' : 'الاستماع'}</h1>
        <p className="mt-1 text-sm text-muted">{mode === 'read' ? 'نصوص متدرجة مع ترجمة بالضغط على الكلمة وأسئلة فهم.' : 'استمع إلى النص بالسرعة التي تناسبك ثم أجب عن الأسئلة.'}</p>
      </div>
      {texts.length === 0 && <p className="text-sm text-muted">لا توجد نصوص بعد.</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {texts.map((t) => {
          const locked = LEVELS.findIndex((l) => l.code === t.level_code) > profile.unlocked_level_index
          const card = (
            <div className={`flex items-center gap-3 rounded-2xl border bg-surface p-4 ${locked ? 'opacity-60' : 'hover:border-brand'}`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">{locked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}</span>
              <div className="min-w-0">
                <p className="truncate font-semibold" dir="ltr">{t.title_en}</p>
                <p className="truncate text-sm text-muted">{t.title_ar}</p>
                <p className="text-xs text-muted"><span dir="ltr">{t.level_code}</span> · {KIND_AR[t.kind]}</p>
              </div>
            </div>
          )
          return <li key={t.id}>{locked ? card : <Link href={`${base}/${t.id}`}>{card}</Link>}</li>
        })}
      </ul>
    </div>
  )
}

export async function TextDetail({ id, mode }: { id: string; mode: 'read' | 'listen' }) {
  const base = mode === 'read' ? '/reading' : '/listening'
  const { supabase, profile } = await requireUser(`${base}/${id}`)
  const { data: t } = await supabase.from('texts').select('id, kind, level_code, title_en, title_ar, body, body_ar, questions').eq('id', id).maybeSingle()
  if (!t) notFound()
  if (LEVELS.findIndex((l) => l.code === t.level_code) > profile.unlocked_level_index) redirect(base)
  return (
    <div className="space-y-5">
      <div>
        <Link href={base} className="text-sm text-brand hover:underline">← العودة</Link>
        <h1 className="mt-2 text-2xl font-bold" dir="ltr">{t.title_en}</h1>
        <p className="text-sm text-muted">{t.title_ar} · <span dir="ltr">{t.level_code}</span> · {KIND_AR[t.kind]}</p>
      </div>
      <TextPractice body={t.body} bodyAr={t.body_ar} items={(t.questions ?? []) as Item[]} mode={mode} />
    </div>
  )
}
