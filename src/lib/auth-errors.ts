/** تحويل رسائل Supabase Auth الإنجليزية إلى رسائل عربية مفهومة. */
export function arabicAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
  if (m.includes('email not confirmed')) return 'أكّد بريدك الإلكتروني أولاً عبر الرابط الذي أرسلناه إليك.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'هذا البريد مسجّل بالفعل. جرّب تسجيل الدخول.'
  if (m.includes('password should be at least') || m.includes('weak password'))
    return 'كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل بحروف وأرقام.'
  if (m.includes('same password')) return 'كلمة المرور الجديدة يجب أن تختلف عن القديمة.'
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes'))
    return 'محاولات كثيرة خلال وقت قصير. انتظر دقيقة ثم أعد المحاولة.'
  if (m.includes('fetch') || m.includes('network'))
    return 'تعذّر الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة.'
  if (m.includes('session') && m.includes('missing'))
    return 'انتهت صلاحية الرابط. اطلب رابط استعادة جديداً.'
  return 'حدث خطأ غير متوقع. أعد المحاولة بعد قليل.'
}
