'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { createClient } from '@/lib/supabase/client'
import { arabicAuthError } from '@/lib/auth-errors'
import { isValidEmail, passwordProblem } from '@/lib/validators'

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const cleanName = name.trim()
    if (cleanName.length < 2 || cleanName.length > 100) return setError('اكتب اسمك (من حرفين إلى 100 حرف).')
    if (!isValidEmail(email)) return setError('اكتب بريداً إلكترونياً صحيحاً.')
    const problem = passwordProblem(password)
    if (problem) return setError(problem)
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين.')

    setLoading(true)
    try {
      const { data, error } = await createClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: cleanName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })
      if (error) {
        setError(arabicAuthError(error.message))
        setLoading(false)
        return
      }
      // مع تفعيل تأكيد البريد: البريد المسجّل مسبقاً يرجع مستخدماً بلا identities
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('هذا البريد مسجّل بالفعل. جرّب تسجيل الدخول.')
        setLoading(false)
        return
      }
      if (data.session) {
        router.replace('/dashboard')
        router.refresh()
        return
      }
      setSentTo(email.trim())
      setLoading(false)
    } catch (err) {
      setError(arabicAuthError(err instanceof Error ? err.message : ''))
      setLoading(false)
    }
  }

  if (sentTo) {
    return (
      <Alert kind="success">
        أرسلنا رابط التأكيد إلى <span dir="ltr" className="font-semibold">{sentTo}</span>. افتح بريدك واضغط
        الرابط لتفعيل الحساب، ثم سجّل الدخول. إن لم تجد الرسالة فتفقّد مجلد الرسائل غير المرغوبة.
      </Alert>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert kind="error">{error}</Alert>}
      <Field
        label="الاسم"
        name="name"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Field
        label="البريد الإلكتروني"
        name="email"
        type="email"
        dir="ltr"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Field
        label="كلمة المرور"
        name="password"
        type="password"
        dir="ltr"
        autoComplete="new-password"
        hint="8 أحرف على الأقل، بحروف وأرقام."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Field
        label="تأكيد كلمة المرور"
        name="confirm"
        type="password"
        dir="ltr"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      <Button type="submit" size="lg" loading={loading} className="w-full">
        إنشاء الحساب
      </Button>
    </form>
  )
}
