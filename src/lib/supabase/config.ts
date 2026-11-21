/** هل متغيرات Supabase مضبوطة؟ تُستخدم لعرض رسالة إعداد واضحة بدل انهيار الصفحة. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
