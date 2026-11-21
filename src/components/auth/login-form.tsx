'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { createClient } from '@/lib/supabase/client'
import { arabicAuthError } from '@/lib/auth-errors'
import { isValidEmail } from '@/lib/validators'

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!isValidEmail(email)) return setError('اكتب بريداً إلكترونياً صحيحاً.')
    if (!password) return setError('اكتب كلمة المرور.')

    setLoading(true)
    try {
      const { error } = await createClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        setError(arabicAuthError(error.message))
        setLoading(false)
        return
      }
      router.replace(next)
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
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <div className="text-end">
        <Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">
          نسيت كلمة المرور؟
        </Link>
      </div>
      <Button type="submit" size="lg" loading={loading} className="w-full">
        تسجيل الدخول
      </Button>
    </form>
  )
}
