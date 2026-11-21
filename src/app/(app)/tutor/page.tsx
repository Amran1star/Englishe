import type { Metadata } from 'next'
import { requireUser } from '@/lib/session'
import { TutorChat } from '@/components/tutor/tutor-chat'

export const metadata: Metadata = { title: 'المدرّس الذكي' }

export default async function TutorPage() {
  const { supabase, profile } = await requireUser('/tutor')
  const { data: quota } = await supabase.rpc('ai_quota')
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">المدرّس الذكي</h1>
        <p className="mt-1 text-sm text-muted">
          محادثة بالإنجليزية مع تصحيح الأخطاء وشرحها بالعربية.
          {quota && <> استخدمت {quota.used} من {quota.limit} طلباً اليوم.</>}
        </p>
      </div>
      <TutorChat level={profile.current_level} />
    </div>
  )
}
