'use client'

import { buttonStyles } from '@/components/ui/button'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold">حدث خطأ غير متوقع</h1>
      <p className="text-muted">لم تُحفظ أي بيانات من هذه العملية. أعد المحاولة، وإن تكرر الخطأ فحدّث الصفحة.</p>
      <button type="button" onClick={reset} className={buttonStyles('primary', 'md')}>
        إعادة المحاولة
      </button>
    </main>
  )
}
