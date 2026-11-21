import type { Metadata } from 'next'
import Link from 'next/link'
import { ConfigWarning } from '@/components/auth/config-warning'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = { title: 'إنشاء حساب' }

export default function RegisterPage() {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold">أنشئ حسابك</h1>
        <p className="text-sm text-muted">يُحفظ تقدمك تلقائياً ويتزامن بين أجهزتك.</p>
      </div>
      <ConfigWarning />
      <RegisterForm />
      <p className="text-center text-sm text-muted">
        لديك حساب؟{' '}
        <Link href="/login" className="font-semibold text-brand hover:underline">سجّل الدخول</Link>
      </p>
    </div>
  )
}
