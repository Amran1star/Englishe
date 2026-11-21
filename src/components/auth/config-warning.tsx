import { Alert } from '@/components/ui/alert'
import { isSupabaseConfigured } from '@/lib/supabase/config'

/** يظهر فقط إذا لم تُضبط متغيرات Supabase بعد، ليعرف المطوّر سبب عدم عمل النماذج. */
export function ConfigWarning() {
  if (isSupabaseConfigured()) return null
  return (
    <Alert kind="error">
      لم يتم ربط قاعدة البيانات بعد. أضف <code dir="ltr">NEXT_PUBLIC_SUPABASE_URL</code> و{' '}
      <code dir="ltr">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> في ملف <code dir="ltr">.env.local</code> ثم أعد
      تشغيل الخادم (راجع README).
    </Alert>
  )
}
