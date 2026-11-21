import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { Alert } from '@/components/ui/alert'

export default async function PlacementPage() {
  const { supabase } = await requireUser('/placement')
  const { data } = await supabase.from('quizzes').select('id').eq('scope', 'placement').eq('is_published', true).limit(1).maybeSingle()
  if (data) redirect(`/quizzes/${data.id}`)
  return <Alert kind="info">اختبار تحديد المستوى غير متاح حالياً.</Alert>
}
