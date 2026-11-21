import { requireAdmin } from '@/lib/session'

interface D { id: string; user_id: string; file_name: string; size_bytes: number; status: string; language: string | null; created_at: string }

export default async function AdminPdfs() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('pdf_documents').select('id, user_id, file_name, size_bytes, status, language, created_at').order('created_at', { ascending: false }).limit(200)
  const docs = (data ?? []) as D[]
  const total = docs.reduce((s, d) => s + d.size_bytes, 0)
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{docs.length} ملفاً · {(total / 1048576).toFixed(1)}MB. تظهر هنا البيانات الوصفية فقط؛ محتوى ملفات المستخدمين خاص بهم.</p>
      <div className="overflow-x-auto rounded-2xl border bg-surface">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-muted"><tr><th className="p-3 text-start">الملف</th><th className="text-start">الحجم</th><th className="text-start">الحالة</th><th className="text-start">اللغة</th><th className="text-start">التاريخ</th></tr></thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-3"><p className="max-w-xs truncate" dir="auto">{d.file_name}</p><p className="text-xs text-muted" dir="ltr">{d.user_id.slice(0, 8)}…</p></td>
                <td dir="ltr">{(d.size_bytes / 1048576).toFixed(1)}MB</td><td>{d.status}</td><td>{d.language ?? '—'}</td>
                <td>{new Date(d.created_at).toLocaleDateString('ar')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
