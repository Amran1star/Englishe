'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { createClient } from '@/lib/supabase/client'
import { arabicAuthError } from '@/lib/auth-errors'
import { passwordProblem } from '@/lib/validators'

export function ResetForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const problem = passwordProblem(password)
    if (problem) return setError(problem)
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين.')

    setLoading(true)
    try {
      const { error } = await createClient().auth.updateUser({ password })
      if (error) {
        setError(arabicAuthError(error.message))
        setLoading(false)
        return
      }
      router.replace('/dashboard')
      router.refresh()
    } catch (err) {
      setError(arabicAuthError(err instanceof Error ? err.message : ''))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert kind="error">{error}</Alert>}
      <Field
        label="كلمة المرور الجديدة"
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
        حفظ كلمة المرور
      </Button>
    </form>
  )
}
