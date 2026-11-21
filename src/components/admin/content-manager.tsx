'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LEVELS } from '@/lib/levels'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface L { id: string; slug: string; title_en: string; title_ar: string; objective_ar: string | null; is_published: boolean; sort_order: number; content: unknown }
interface U { id: string; level_code: string; title_en: string; title_ar: string; is_published: boolean; sort_order: number; lessons: L[] }

const inp = 'h-10 w-full rounded-lg border bg-surface px-3 text-sm'

export function ContentManager({ initial }: { initial: U[] }) {
  const supabase = createClient()
  const [units, setUnits] = useState(initial)
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [edit, setEdit] = useState<L | null>(null)
  const [json, setJson] = useState('')
  const [nu, setNu] = useState({ level_code: 'A0', title_en: '', title_ar: '' })
  const [nl, setNl] = useState<{ unit: string; slug: string; title_en: string; title_ar: string }>({ unit: '', slug: '', title_en: '', title_ar: '' })

  const ok = (t: string) => setMsg({ kind: 'success', text: t })
  const bad = (t: string) => setMsg({ kind: 'error', text: t })

  const togglePublish = async (table: 'units' | 'lessons', id: string, value: boolean) => {
    const { error } = await supabase.from(table).update({ is_published: value }).eq('id', id)
    if (error) return bad('تعذّر التحديث.')
    setUnits(units.map((u) => (table === 'units' && u.id === id ? { ...u, is_published: value } : { ...u, lessons: u.lessons.map((l) => (table === 'lessons' && l.id === id ? { ...l, is_published: value } : l)) })))
  }

  const addUnit = async () => {
    if (!nu.title_en.trim() || !nu.title_ar.trim()) return bad('اكتب عنوان الوحدة بالعربية والإنجليزية.')
    const order = units.filter((u) => u.level_code === nu.level_code).length
    const { data, error } = await supabase.from('units').insert({ ...nu, sort_order: order, is_published: false }).select('id, level_code, title_en, title_ar, is_published, sort_order').single()
    if (error || !data) return bad('تعذّرت إضافة الوحدة.')
    setUnits([...units, { ...(data as Omit<U, 'lessons'>), lessons: [] }])
    setNu({ ...nu, title_en: '', title_ar: '' })
    ok('أُضيفت الوحدة (غير منشورة).')
  }

  const addLesson = async () => {
    if (!nl.unit || !/^[a-z0-9-]+$/.test(nl.slug) || !nl.title_en.trim() || !nl.title_ar.trim()) return bad('أكمل الحقول (المعرّف بحروف إنجليزية صغيرة وأرقام وشرطات فقط).')
    const u = units.find((x) => x.id === nl.unit)!
    const { data, error } = await supabase.from('lessons').insert({ unit_id: nl.unit, slug: nl.slug, title_en: nl.title_en, title_ar: nl.title_ar, sort_order: u.lessons.length, content: { explain: [], examples: [] }, is_published: false })
      .select('id, slug, title_en, title_ar, objective_ar, is_published, sort_order, content').single()
    if (error || !data) return bad(error?.code === '23505' ? 'هذا المعرّف مستخدم في الوحدة نفسها.' : 'تعذّرت إضافة الدرس.')
    setUnits(units.map((x) => (x.id === nl.unit ? { ...x, lessons: [...x.lessons, data as L] } : x)))
    setNl({ ...nl, slug: '', title_en: '', title_ar: '' })
    ok('أُضيف الدرس (غير منشور). أضف له اختباراً من صفحة الاختبارات قبل نشره.')
  }

  const saveLesson = async () => {
    if (!edit) return
    let content: unknown
    try {
      content = JSON.parse(json)
      if (typeof content !== 'object' || content === null || Array.isArray(content)) throw new Error()
    } catch {
      return bad('محتوى الدرس ليس JSON صالحاً (يجب أن يكون كائناً).')
    }
    const patch = { title_en: edit.title_en, title_ar: edit.title_ar, objective_ar: edit.objective_ar, content }
    const { error } = await supabase.from('lessons').update(patch).eq('id', edit.id)
    if (error) return bad('تعذّر الحفظ.')
    setUnits(units.map((u) => ({ ...u, lessons: u.lessons.map((l) => (l.id === edit.id ? { ...l, ...patch } : l)) })))
    setEdit(null)
    ok('حُفظ الدرس.')
  }

  return (
    <div className="space-y-5">
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}

      {edit && (
        <section className="space-y-3 rounded-2xl border border-brand/50 bg-surface p-5">
          <h2 className="font-bold">تعديل الدرس</h2>
          <input className={inp} dir="ltr" value={edit.title_en} onChange={(e) => setEdit({ ...edit, title_en: e.target.value })} aria-label="العنوان بالإنجليزية" />
          <input className={inp} value={edit.title_ar} onChange={(e) => setEdit({ ...edit, title_ar: e.target.value })} aria-label="العنوان بالعربية" />
          <input className={inp} value={edit.objective_ar ?? ''} onChange={(e) => setEdit({ ...edit, objective_ar: e.target.value })} placeholder="الهدف التعليمي" />
          <textarea dir="ltr" rows={14} value={json} onChange={(e) => setJson(e.target.value)} className="w-full rounded-lg border bg-surface p-3 font-mono text-xs" aria-label="محتوى الدرس JSON" />
          <p className="text-xs text-muted">الشكل: {'{ "explain": [...], "rule": { "title", "points": [] }, "examples": [{ "en", "ar" }], "daily": [...] }'}</p>
          <div className="flex gap-2"><Button onClick={saveLesson}>حفظ</Button><Button variant="ghost" onClick={() => setEdit(null)}>إلغاء</Button></div>
        </section>
      )}

      {units.map((u) => (
        <section key={u.id} className="rounded-2xl border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold"><span dir="ltr">{u.level_code}</span> · {u.title_ar}</p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={u.is_published} onChange={(e) => togglePublish('units', u.id, e.target.checked)} />منشورة</label>
          </div>
          <ul className="mt-3 divide-y">
            {u.lessons.sort((a, b) => a.sort_order - b.sort_order).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>{l.title_ar} <span className="text-xs text-muted" dir="ltr">({l.slug})</span></span>
                <span className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5"><input type="checkbox" checked={l.is_published} onChange={(e) => togglePublish('lessons', l.id, e.target.checked)} />منشور</label>
                  <button type="button" className="text-brand hover:underline" onClick={() => { setEdit(l); setJson(JSON.stringify(l.content, null, 2)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>تعديل</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="space-y-3 rounded-2xl border bg-surface p-5">
        <h2 className="font-bold">إضافة وحدة</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <select className={inp} value={nu.level_code} onChange={(e) => setNu({ ...nu, level_code: e.target.value })}>{LEVELS.map((l) => <option key={l.code}>{l.code}</option>)}</select>
          <input className={inp} dir="ltr" placeholder="Title (English)" value={nu.title_en} onChange={(e) => setNu({ ...nu, title_en: e.target.value })} />
          <input className={inp} placeholder="العنوان بالعربية" value={nu.title_ar} onChange={(e) => setNu({ ...nu, title_ar: e.target.value })} />
        </div>
        <Button variant="secondary" onClick={addUnit}>إضافة</Button>
      </section>

      <section className="space-y-3 rounded-2xl border bg-surface p-5">
        <h2 className="font-bold">إضافة درس</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <select className={inp} value={nl.unit} onChange={(e) => setNl({ ...nl, unit: e.target.value })}>
            <option value="">اختر الوحدة</option>{units.map((u) => <option key={u.id} value={u.id}>{u.level_code} · {u.title_ar}</option>)}
          </select>
          <input className={inp} dir="ltr" placeholder="slug-like-this" value={nl.slug} onChange={(e) => setNl({ ...nl, slug: e.target.value })} />
          <input className={inp} dir="ltr" placeholder="Title (English)" value={nl.title_en} onChange={(e) => setNl({ ...nl, title_en: e.target.value })} />
          <input className={inp} placeholder="العنوان بالعربية" value={nl.title_ar} onChange={(e) => setNl({ ...nl, title_ar: e.target.value })} />
        </div>
        <Button variant="secondary" onClick={addLesson}>إضافة</Button>
      </section>
    </div>
  )
}
