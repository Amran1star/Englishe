/** وصف مستويات CEFR للعرض في الواجهة. مصدر الحقيقة للمحتوى هو جدول levels في قاعدة البيانات. */
export const LEVELS = [
  { code: 'A0', titleAr: 'الصفر المطلق', titleEn: 'Absolute Beginner' },
  { code: 'A1', titleAr: 'مبتدئ', titleEn: 'Beginner' },
  { code: 'A2', titleAr: 'ما قبل المتوسط', titleEn: 'Elementary' },
  { code: 'B1', titleAr: 'متوسط', titleEn: 'Intermediate' },
  { code: 'B2', titleAr: 'فوق المتوسط', titleEn: 'Upper-Intermediate' },
  { code: 'C1', titleAr: 'متقدم', titleEn: 'Advanced' },
] as const

export type LevelCode = (typeof LEVELS)[number]['code']
