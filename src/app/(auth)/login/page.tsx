import type { Metadata } from 'next'
import Link from 'next/link'
import { Alert } from '@/components/ui/alert'
import { ConfigWarning } from '@/components/auth/config-warning'
import { LoginForm } from '@/components/auth/login-form'
import { safeRedirect } from '@/lib/validators'

export const metadata: Metadata = { title: 'تسجيل الدخول' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string }
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold">أهلاً بعودتك</h1>
        <p className="text-sm text-muted">سجّل دخولك لتكمل من حيث توقفت.</p>
      </div>
      <ConfigWarning />
      {searchParams.error === 'callback' && (
        <Alert kind="error">انتهت صلاحية الرابط أو أنه غير صالح. حاول مرة أخرى.</Alert>
      )}
      <LoginForm next={safeRedirect(searchParams.next)} />
      <p className="text-center text-sm text-muted">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="font-semibold text-brand hover:underline">أنشئ حساباً</Link>
      </p>
    </div>
  )
}
