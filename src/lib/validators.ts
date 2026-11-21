const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const isValidEmail = (v: string) => v.length <= 254 && EMAIL_RE.test(v.trim())

/** يعيد نص المشكلة بالعربية أو null إن كانت كلمة المرور مقبولة. */
export function passwordProblem(p: string): string | null {
  if (p.length < 8) return 'كلمة المرور يجب ألا تقل عن 8 أحرف.'
  if (p.length > 72) return 'كلمة المرور طويلة جداً (الحد الأقصى 72 حرفاً).'
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'استخدم حروفاً وأرقاماً معاً في كلمة المرور.'
  return null
}

/** يمنع إعادة التوجيه إلى مواقع خارجية (Open Redirect): يقبل مسارات داخلية فقط. */
export function safeRedirect(next: string | null | undefined, fallback = '/dashboard'): string {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\')) {
    return next
  }
  return fallback
}
