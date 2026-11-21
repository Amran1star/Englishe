import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { Profile } from '@/lib/types'

const COLS =
  'id, full_name, role, current_level, unlocked_level_index, xp, streak_days, preferred_accent, daily_goal_minutes, placement_completed, show_on_leaderboard'

/** للصفحات المحمية: يعيد العميل والمستخدم والملف الشخصي أو يحوّل إلى تسجيل الدخول. */
export async function requireUser(nextPath = '/dashboard') {
  if (!isSupabaseConfigured()) redirect('/login')
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  const { data: profile } = await supabase.from('profiles').select(COLS).eq('id', user.id).maybeSingle()
  if (!profile) redirect('/login?error=callback')
  return { supabase, user, profile: profile as Profile }
}

export async function requireAdmin() {
  const ctx = await requireUser('/admin')
  if (ctx.profile.role !== 'admin') redirect('/dashboard')
  return ctx
}
