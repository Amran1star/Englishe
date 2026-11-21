'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LEVELS } from '@/lib/levels'
import { Alert } from '@/components/ui/alert'

interface U { id: string; email: string; full_name: string; role: 'student' | 'admin'; current_level: string; unlocked_level_index: number; xp: number; created_at: string }

export function UsersTable({ users, meId }: { users: U[]; meId: string }) {
  const [rows, setRows] = useState(users)
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const update = async (id: string, patch: Partial<U>) => {
    setMsg(null)
    const { error } = await createClient().from('profiles').update(patch).eq('id', id)
    if (error) return setMsg({ kind: 'error', text: 'تعذّر التحديث.' })
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    setMsg({ kind: 'success', text: 'تم التحديث.' })
  }
  const shown = rows.filter((r) => !q || r.email.toLowerCase().includes(q.toLowerCase()) || r.full_name.includes(q))
  const sel = 'h-9 rounded-lg border bg-surface px-2 text-sm'
  return (
    <div className="space-y-3">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالبريد أو الاسم" className="h-10 w-full rounded-xl border bg-surface px-3 text-sm sm:w-72" />
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <div className="overflow-x-auto rounded-2xl border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-muted"><tr><th className="p-3 text-start">المستخدم</th><th className="text-start">الدور</th><th className="text-start">المستوى المفتوح</th><th className="text-start">XP</th></tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3"><p className="font-medium">{r.full_name || '—'}</p><p className="text-xs text-muted" dir="ltr">{r.email}</p></td>
                <td>
                  <select className={sel} value={r.role} disabled={r.id === meId} onChange={(e) => update(r.id, { role: e.target.value as U['role'] })} aria-label="الدور">
                    <option value="student">طالب</option><option value="admin">مدير</option>
                  </select>
                </td>
                <td>
                  <select className={sel} value={r.unlocked_level_index} onChange={(e) => { const i = Number(e.target.value); update(r.id, { unlocked_level_index: i, current_level: LEVELS[i].code }) }} aria-label="المستوى">
                    {LEVELS.map((l, i) => <option key={l.code} value={i}>{l.code}</option>)}
                  </select>
                </td>
                <td dir="ltr">{r.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
