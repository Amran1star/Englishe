import { requireAdmin } from '@/lib/session'
import { QuizManager } from '@/components/admin/quiz-manager'

export default async function AdminQuizzes() {
  const { supabase } = await requireAdmin()
  const [{ data: quizzes }, { data: lessons }] = await Promise.all([
    supabase.from('quizzes').select('id, title_ar, scope, level_code, lesson_id, is_published').order('created_at', { ascending: false }),
    supabase.from('lessons').select('id, title_ar, units(level_code)').order('title_ar'),
  ])
  const ls = ((lessons ?? []) as unknown as { id: string; title_ar: string; units: { level_code: string } | { level_code: string }[] }[]).map((l) => ({
    id: l.id, title_ar: l.title_ar, level_code: (Array.isArray(l.units) ? l.units[0] : l.units).level_code,
  }))
  return <QuizManager initialQuizzes={quizzes ?? []} lessons={ls} />
}
