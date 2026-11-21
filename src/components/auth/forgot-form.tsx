'use client'

import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { createClient } from '@/lib/supabase/client'
import { arabicAuthError } from '@/lib/auth-errors'
import { isValidEmail } from '@/lib/validators'

export function ForgotForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!isValidEmail(email)) return setError('اكتب بريداً إلكترونياً صحيحاً.')

    setLoading(true)
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (error) {
        setError(arabicAuthError(error.message))
        setLoading(false)
        return
      }
      setDone(true)
    } catch (err) {
      setError(arabicAuthError(err instanceof Error ? err.message : ''))
    }
    setLoading(false)
  }

  if (done) {
    return (
      <Alert kind="success">
        إذا كان هذا البريد مسجّلاً لدينا فسيصلك رابط لتعيين كلمة مرور جديدة خلال دقائق.
      </Alert>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert kind="error">{error}</Alert>}
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
      <Button type="submit" size="lg" loading={loading} className="w-full">
        أرسل رابط الاستعادة
      </Button>
    </form>
  )
}
