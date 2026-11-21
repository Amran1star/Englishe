'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { passwordProblem } from '@/lib/validators'
import { arabicAuthError } from '@/lib/auth-errors'

interface P { id: string; full_name: string; preferred_accent: 'us' | 'uk'; daily_goal_minutes: number; show_on_leaderboard: boolean }

export function ProfileForm({ profile, email }: { profile: P; email: string }) {
  const router = useRouter()
  const [name, setName] = useState(profile.full_name)
  const [accent, setAccent] = useState(profile.preferred_accent)
  const [goal, setGoal] = useState(profile.daily_goal_minutes)
  const [board, setBoard] = useState(profile.show_on_leaderboard)
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [pw, setPw] = useState('')
  const [pwMsg, setPwMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    const n = name.trim()
    if (n.length < 2 || n.length > 100) return setMsg({ kind: 'error', text: 'الاسم من حرفين إلى 100 حرف.' })
    setSaving(true)
    const { error } = await createClient().from('profiles').update({ full_name: n, preferred_accent: accent, daily_goal_minutes: goal, show_on_leaderboard: board }).eq('id', profile.id)
    setSaving(false)
    if (error) setMsg({ kind: 'error', text: 'تعذّر الحفظ.' })
    else { setMsg({ kind: 'success', text: 'تم حفظ التغييرات.' }); router.refresh() }
  }

  const changePw = async (e: FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    const p = passwordProblem(pw)
    if (p) return setPwMsg({ kind: 'error', text: p })
    const { error } = await createClient().auth.updateUser({ password: pw })
    if (error) setPwMsg({ kind: 'error', text: arabicAuthError(error.message) })
    else { setPwMsg({ kind: 'success', text: 'تم تغيير كلمة المرور.' }); setPw('') }
  }

  const chip = (on: boolean) => `rounded-xl border px-4 py-2 text-sm font-medium ${on ? 'border-brand bg-brand text-brand-fg' : 'bg-surface hover:bg-surface-2'}`
  return (
    <div className="space-y-6">
      <form onSubmit={save} className="space-y-4 rounded-2xl border bg-surface p-5" noValidate>
        <p className="text-sm text-muted">البريد: <span dir="ltr">{email}</span></p>
        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
        <Field label="الاسم" name="name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="space-y-1.5">
          <p className="text-sm font-medium">اللكنة المفضلة للنطق</p>
          <div className="flex gap-2"><button type="button" className={chip(accent === 'us')} onClick={() => setAccent('us')}>أمريكية</button><button type="button" className={chip(accent === 'uk')} onClick={() => setAccent('uk')}>بريطانية</button></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">الهدف اليومي (دقائق)</p>
          <div className="flex flex-wrap gap-2">{[10, 15, 30, 45, 60].map((m) => <button key={m} type="button" className={chip(goal === m)} onClick={() => setGoal(m)} dir="ltr">{m}</button>)}</div>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={board} onChange={(e) => setBoard(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--brand))]" />
          أظهر اسمي ونقاطي في لوحة الشرف (اختياري)
        </label>
        <Button type="submit" loading={saving}>حفظ</Button>
      </form>

      <form onSubmit={changePw} className="space-y-4 rounded-2xl border bg-surface p-5" noValidate>
        <h2 className="font-bold">تغيير كلمة المرور</h2>
        {pwMsg && <Alert kind={pwMsg.kind}>{pwMsg.text}</Alert>}
        <Field label="كلمة المرور الجديدة" name="pw" type="password" dir="ltr" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} hint="8 أحرف على الأقل، بحروف وأرقام." />
        <Button type="submit" variant="secondary">تغيير</Button>
      </form>
    </div>
  )
}
