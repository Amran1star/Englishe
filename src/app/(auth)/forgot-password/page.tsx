import type { Metadata } from 'next'
import Link from 'next/link'
import { ConfigWarning } from '@/components/auth/config-warning'
import { ForgotForm } from '@/components/auth/forgot-form'

export const metadata: Metadata = { title: 'استعادة كلمة المرور' }

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
        <p className="text-sm text-muted">اكتب بريدك وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.</p>
      </div>
      <ConfigWarning />
      <ForgotForm />
      <p className="text-center text-sm">
        <Link href="/login" className="font-semibold text-brand hover:underline">العودة إلى تسجيل الدخول</Link>
      </p>
    </div>
  )
}
