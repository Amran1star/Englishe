import { requireAdmin } from '@/lib/session'
import { Alert } from '@/components/ui/alert'

interface Stats {
  users: number; admins: number; active_today: number; lessons_completed: number; quiz_attempts: number
  pdf_documents: number; pdf_quizzes: number; ai_calls_30d: number; ai_tokens_30d: number
  ai_by_feature: { feature: string; calls: number; tokens: number }[]
}

export default async function AdminHome() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.rpc('admin_stats')
  const s = data as Stats | null
  if (!s) return <Alert kind="error">تعذّر تحميل الإحصائيات.</Alert>
  const cards = [
    ['المستخدمون', s.users], ['نشطون اليوم', s.active_today], ['المديرون', s.admins], ['دروس مكتملة', s.lessons_completed],
    ['محاولات الاختبارات', s.quiz_attempts], ['ملفات PDF', s.pdf_documents], ['اختبارات PDF', s.pdf_quizzes], ['طلبات الذكاء الاصطناعي (30 يوماً)', s.ai_calls_30d],
  ] as const
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([l, v]) => <div key={l} className="rounded-2xl border bg-surface p-4"><p className="text-xs text-muted">{l}</p><p className="mt-1 text-2xl font-bold" dir="ltr">{v}</p></div>)}
      </section>
      <section className="rounded-2xl border bg-surface p-5">
        <h2 className="font-bold">استهلاك الذكاء الاصطناعي (آخر 30 يوماً)</h2>
        <p className="mt-1 text-sm text-muted">إجمالي الرموز (tokens): <b dir="ltr">{s.ai_tokens_30d}</b></p>
        {s.ai_by_feature.length === 0 ? <p className="mt-3 text-sm text-muted">لا استهلاك بعد.</p> : (
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-start text-muted"><th className="py-1 text-start">الميزة</th><th className="text-start">الطلبات</th><th className="text-start">الرموز</th></tr></thead>
            <tbody>{s.ai_by_feature.map((f) => <tr key={f.feature} className="border-t"><td className="py-1.5" dir="ltr">{f.feature}</td><td dir="ltr">{f.calls}</td><td dir="ltr">{f.tokens}</td></tr>)}</tbody>
          </table>
        )}
      </section>
    </div>
  )
}
