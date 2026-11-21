import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { safeRedirect } from '@/lib/validators'

/** يستقبل روابط البريد (تأكيد الحساب / استعادة كلمة المرور) ويحوّل الكود إلى جلسة. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRedirect(searchParams.get('next'))

  if (code && isSupabaseConfigured()) {
    const { error } = await createClient().auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/login?error=callback`)
}
