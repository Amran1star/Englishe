export type ItemType = 'mcq' | 'tf' | 'fill' | 'order' | 'matching' | 'short'

/** سؤال/تمرين واحد. يُصحَّح في المتصفح للتمارين والنصوص وPDF فقط (الاختبارات الرسمية تُصحَّح في قاعدة البيانات). */
export interface Item {
  t: ItemType
  p: string
  o?: string[]
  w?: string[]
  pairs?: { left: string; right: string }[]
  a?: number | boolean | string | string[]
  acc?: string[]
  e?: string
  src?: string
}

export type Answer = number | boolean | string | Record<string, string>

export interface QuizQuestion {
  id: string
  type: ItemType
  body: { prompt: string; options?: string[]; words?: string[] }
}

export interface QuizResultItem {
  id: string
  type: string
  correct: boolean
  your_answer: unknown
  correct_answer: string | null
  explanation: string | null
}

export interface QuizResult {
  attempt_id: string
  score: number
  total: number
  percentage: number
  passed: boolean
  xp_earned: number
  placed_level: string | null
  results: QuizResultItem[]
}

export interface LessonContent {
  explain?: string[]
  rule?: { title: string; points: string[] }
  examples?: { en: string; ar: string }[]
  daily?: { en: string; ar: string }[]
}

export interface Profile {
  id: string
  full_name: string
  role: 'student' | 'admin'
  current_level: string
  unlocked_level_index: number
  xp: number
  streak_days: number
  preferred_accent: 'us' | 'uk'
  daily_goal_minutes: number
  placement_completed: boolean
  show_on_leaderboard: boolean
}
