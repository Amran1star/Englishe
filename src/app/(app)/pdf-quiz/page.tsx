import type { Metadata } from 'next'
import { requireUser } from '@/lib/session'
import { PdfQuizApp } from '@/components/pdf/pdf-quiz-app'

export const metadata: Metadata = { title: 'PDF إلى اختبار تفاعلي' }

export default async function PdfQuizPage() {
  const { supabase, user } = await requireUser('/pdf-quiz')
  const { data } = await supabase.from('pdf_documents').select('id, file_name, size_bytes, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false })
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">PDF إلى اختبار تفاعلي</h1>
        <p className="mt-1 text-sm text-muted">ارفع ملفاً بالعربية أو الإنجليزية وستُبنى الأسئلة من محتواه فقط، مع ذكر الصفحة التي استُند إليها.</p>
      </div>
      <PdfQuizApp userId={user.id} initialDocs={data ?? []} />
    </div>
  )
}
