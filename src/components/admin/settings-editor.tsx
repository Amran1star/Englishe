'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface S { key: string; value: unknown; is_public: boolean }
const inp = 'h-10 w-full rounded-lg border bg-surface px-3 text-sm'

export function SettingsEditor({ initial }: { initial: S[] }) {
  const supabase = createClient()
  const [rows, setRows] = useState(initial)
  const [key, setKey] = useState('')
  const [val, setVal] = useState('')
  const [pub, setPub] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const save = async () => {
    if (!/^[a-z0-9_]{2,60}$/.test(key)) return setMsg({ kind: 'error', text: 'المفتاح: حروف إنجليزية صغيرة وأرقام و _ فقط.' })
    let value: unknown
    try { value = JSON.parse(val) } catch { return setMsg({ kind: 'error', text: 'القيمة يجب أن تكون JSON صالحاً (مثال: 40 أو "نص").' }) }
    const { error } = await supabase.from('site_settings').upsert({ key, value, is_public: pub, updated_at: new Date().toISOString() })
    if (error) return setMsg({ kind: 'error', text: 'تعذّر الحفظ.' })
    setRows([...rows.filter((r) => r.key !== key), { key, value, is_public: pub }].sort((a, b) => a.key.localeCompare(b.key)))
    setMsg({ kind: 'success', text: 'تم الحفظ.' })
  }
  const del = async (k: string) => {
    const { error } = await supabase.from('site_settings').delete().eq('key', k)
    if (error) return setMsg({ kind: 'error', text: 'تعذّر الحذف.' })
    setRows(rows.filter((r) => r.key !== k))
  }

  return (
    <div className="space-y-5">
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <Alert kind="info">مفتاح <b dir="ltr">ai_daily_limit</b> (رقم) يحدد الحد اليومي لطلبات الذكاء الاصطناعي لكل مستخدم، والافتراضي 40.</Alert>
      <section className="rounded-2xl border bg-surface p-5">
        <h2 className="mb-3 font-bold">الإعدادات الحالية</h2>
        {rows.length === 0 ? <p className="text-sm text-muted">لا إعدادات بعد.</p> : (
          <ul className="divide-y text-sm">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center justify-between gap-3 py-2">
                <button type="button" className="text-start" onClick={() => { setKey(r.key); setVal(JSON.stringify(r.value)); setPub(r.is_public) }}>
                  <b dir="ltr">{r.key}</b> = <span dir="ltr">{JSON.stringify(r.value)}</span> {r.is_public && <span className="text-xs text-muted">(عام)</span>}
                </button>
                <button type="button" onClick={() => del(r.key)} className="text-red-600 hover:underline">حذف</button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-3 rounded-2xl border bg-surface p-5">
        <h2 className="font-bold">إضافة / تعديل</h2>
        <input className={inp} dir="ltr" placeholder="key_name" value={key} onChange={(e) => setKey(e.target.value)} />
        <input className={inp} dir="ltr" placeholder='value (JSON) مثال: 40' value={val} onChange={(e) => setVal(e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} />قابل للقراءة من الزوار (عام)</label>
        <Button onClick={save}>حفظ</Button>
      </section>
    </div>
  )
}
