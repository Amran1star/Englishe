import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ResetForm } from '@/components/auth/reset-form'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export const metadata: Metadata = { title: 'كلمة مرور جديدة' }

export default async function ResetPasswordPage() {
  // الصفحة تعمل فقط بعد فتح رابط الاستعادة (الذي ينشئ جلسة مؤقتة)
  if (!isSupabaseConfigured()) redirect('/login')
  const {
    data: { user },
  } = await createClient().auth.getUser()
  if (!user) redirect('/login?error=callback')

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold">كلمة مرور جديدة</h1>
        <p className="text-sm text-muted">اختر كلمة مرور قوية لا تستخدمها في مواقع أخرى.</p>
      </div>
      <ResetForm />
    </div>
  )
}
