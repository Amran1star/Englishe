import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { ApiError } from '@/lib/ai'

/** يتحقق من تسجيل الدخول في مسارات الـ API. */
export async function authed() {
  if (!isSupabaseConfigured()) throw new ApiError(503, 'الخادم غير مهيأ.')
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new ApiError(401, 'سجّل الدخول أولاً.')
  return { supabase, user }
}

export function fail(e: unknown) {
  if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status })
  console.error(e)
  return NextResponse.json({ error: 'حدث خطأ غير متوقع.' }, { status: 500 })
}

export async function readJson<T>(req: Request, maxBytes = 200_000): Promise<T> {
  const raw = await req.text()
  if (raw.length > maxBytes) throw new ApiError(413, 'الطلب كبير جداً.')
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new ApiError(400, 'طلب غير صالح.')
  }
}
