import Link from 'next/link'
import { buttonStyles } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-6xl font-bold text-brand" dir="ltr">404</p>
      <h1 className="text-xl font-semibold">لم نجد هذه الصفحة</h1>
      <p className="text-muted">قد يكون الرابط خاطئاً أو أن الصفحة لم تُضف بعد.</p>
      <Link href="/" className={buttonStyles('primary', 'md')}>العودة إلى الرئيسية</Link>
    </main>
  )
}
