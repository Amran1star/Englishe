import type { Metadata } from 'next'
import Link from 'next/link'
import { Award, BookOpen, Clock, Flame, Layers, Target, Trophy, Zap } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { LEVELS } from '@/lib/levels'
import { ClaimButton } from '@/components/app/claim-button'
import { Alert } from '@/components/ui/alert'
import { buttonStyles } from '@/components/ui/button'

export const metadata: Metadata = { title: 'لوحة التحكم' }

const TYPE_AR: Record<string, string> = { mcq: 'اختيار من متعدد', tf: 'صح / خطأ', fill: 'إكمال الفراغ', order: 'ترتيب الكلمات' }
const ACT_AR: Record<string, string> = {
  quiz_attempt: 'اختبار', lesson_completed: 'إكمال درس', word_review: 'مراجعة كلمة', challenge_claimed: 'مكافأة تحدٍّ',
  practice_reading: 'تدريب قراءة', practice_listening: 'تدريب استماع', practice_writing: 'تدريب كتابة', practice_tutor: 'محادثة مع المدرّس',
  practice_pdf_quiz: 'اختبار PDF', practice_game_match: 'لعبة المطابقة', practice_game_order: 'لعبة الترتيب', practice_pronunciation: 'تدريب نطق',
}
const CHALLENGES: Record<string, string> = { daily_lesson: 'أكمل درساً اليوم', daily_words: 'راجع 5 كلمات اليوم', weekly_lessons: 'أكمل 3 دروس هذا الأسبوع' }

interface Dash {
  profile: { full_name: string; current_level: string; xp: number; streak_days: number; daily_goal_minutes: number; placement_completed: boolean }
  levels: { code: string; title_ar: string; total: number; done: number }[]
  lessons_completed: number
  words_learned: number
  words_due: number
  minutes_total: number
  minutes_today: number
  last_lesson: { id: string; title_ar: string; status: string } | null
  recent_attempts: { id: string; title: string; percentage: number; passed: boolean; created_at: string }[]
  activity: { type: string; xp: number; created_at: string }[]
  skills: { type: string; correct: number; total: number }[]
  achievements: { code: string; title_ar: string; description_ar: string; earned: boolean }[]
  challenges: { code: string; target: number; xp: number; progress: number; claimed: boolean }[]
}

const fmt = (d: string) => new Date(d).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' })

export default async function DashboardPage() {
  const { supabase } = await requireUser('/dashboard')
  const [{ data }, { data: board }] = await Promise.all([supabase.rpc('student_dashboard'), supabase.rpc('leaderboard')])
  const d = data as Dash | null
  if (!d) return <Alert kind="error">تعذّر تحميل بياناتك. حدّث الصفحة.</Alert>

  const level = LEVELS.find((l) => l.code === d.profile.current_level) ?? LEVELS[0]
  const goalPct = Math.min(100, Math.round((Number(d.minutes_today) / d.profile.daily_goal_minutes) * 100))
  const skills = d.skills.map((s) => ({ ...s, pct: Math.round((s.correct / s.total) * 100) }))
  const weakest = skills.filter((s) => s.total >= 3).sort((a, b) => a.pct - b.pct)[0]
  const stats = [
    { label: 'المستوى', value: level.code, sub: level.titleAr, icon: Layers },
    { label: 'نقاط الخبرة', value: String(d.profile.xp), sub: 'XP', icon: Zap },
    { label: 'أيام متتالية', value: String(d.profile.streak_days), sub: 'يوم', icon: Flame },
    { label: 'دروس مكتملة', value: String(d.lessons_completed), sub: 'درس', icon: BookOpen },
    { label: 'كلمات تعلّمتها', value: String(d.words_learned), sub: `${d.words_due} للمراجعة الآن`, icon: Target },
    { label: 'وقت التعلم', value: String(Math.round(Number(d.minutes_total))), sub: 'دقيقة', icon: Clock },
  ]
  const card = 'rounded-2xl border bg-surface p-5'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">أهلاً {d.profile.full_name || 'بك'}</h1>
          <p className="mt-1 text-sm text-muted">تتحدّث هذه البيانات تلقائياً من حسابك.</p>
        </div>
        {d.last_lesson && (
          <Link href={`/lessons/${d.last_lesson.id}`} className={buttonStyles('primary', 'md')}>
            {d.last_lesson.status === 'completed' ? 'راجع' : 'تابع'}: {d.last_lesson.title_ar}
          </Link>
        )}
      </div>

      {!d.profile.placement_completed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/40 bg-brand-soft p-5">
          <div>
            <p className="font-semibold">حدّد مستواك أولاً</p>
            <p className="text-sm text-muted">اختبار قصير (12 سؤالاً) يفتح لك المستوى المناسب. أو ابدأ من A0.</p>
          </div>
          <Link href="/placement" className={buttonStyles('primary', 'md')}>ابدأ الاختبار</Link>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label="ملخص">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className={card}>
            <div className="flex items-center justify-between text-sm text-muted">{label}<Icon className="h-4 w-4" aria-hidden /></div>
            <p className="mt-2 text-3xl font-bold" dir="ltr">{value}</p>
            <p className="text-xs text-muted">{sub}</p>
          </div>
        ))}
      </section>

      <section className={card}>
        <div className="flex items-center justify-between text-sm">
          <h2 className="font-bold">هدف اليوم</h2>
          <span className="text-muted" dir="ltr">{Math.round(Number(d.minutes_today))} / {d.profile.daily_goal_minutes} min</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-accent" style={{ width: `${goalPct}%` }} /></div>
      </section>

      <section className={card}>
        <h2 className="mb-4 font-bold">التقدم في المستويات</h2>
        <ul className="space-y-3">
          {d.levels.map((l) => {
            const pct = l.total ? Math.round((l.done / l.total) * 100) : 0
            return (
              <li key={l.code}>
                <div className="mb-1 flex justify-between text-sm"><span><b dir="ltr">{l.code}</b> {l.title_ar}</span><span className="text-muted">{l.done}/{l.total} درساً</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className={card}>
          <h2 className="mb-4 font-bold">التحديات</h2>
          <ul className="space-y-4">
            {d.challenges.map((c) => (
              <li key={c.code} className="space-y-2">
                <div className="flex justify-between text-sm"><span>{CHALLENGES[c.code]}</span><span className="text-muted">{Math.min(c.progress, c.target)}/{c.target}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (c.progress / c.target) * 100)}%` }} /></div>
                {c.claimed ? <p className="text-xs text-emerald-600">تم استلام المكافأة</p> : c.progress >= c.target ? <ClaimButton code={c.code} xp={c.xp} /> : <p className="text-xs text-muted">المكافأة: {c.xp} XP</p>}
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <h2 className="mb-4 font-bold">نقاط القوة والضعف</h2>
          {skills.length === 0 ? <p className="text-sm text-muted">ستظهر بعد أول اختباراتك.</p> : (
            <ul className="space-y-3">
              {skills.map((s) => (
                <li key={s.type}>
                  <div className="mb-1 flex justify-between text-sm"><span>{TYPE_AR[s.type] ?? s.type}</span><span className="text-muted" dir="ltr">{s.pct}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className={`h-full rounded-full ${s.pct >= 70 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${s.pct}%` }} /></div>
                </li>
              ))}
              {weakest && <p className="pt-1 text-sm">تحتاج مزيداً من التدريب على: <b>{TYPE_AR[weakest.type] ?? weakest.type}</b></p>}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 font-bold">آخر الاختبارات</h2>
          {d.recent_attempts.length === 0 ? <p className="text-sm text-muted">لا توجد اختبارات بعد.</p> : (
            <ul className="divide-y">
              {d.recent_attempts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="truncate" dir="auto">{a.title}</span>
                  <span className={`shrink-0 font-semibold ${a.passed ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">{Math.round(a.percentage)}%</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/results" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">كل النتائج</Link>
        </section>

        <section className={card}>
          <h2 className="mb-3 font-bold">سجل النشاط</h2>
          {d.activity.length === 0 ? <p className="text-sm text-muted">لا نشاط بعد.</p> : (
            <ul className="divide-y">
              {d.activity.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>{ACT_AR[a.type] ?? a.type}</span>
                  <span className="text-xs text-muted">{a.xp > 0 && <b className="text-brand">+{a.xp} · </b>}{fmt(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={card}>
        <h2 className="mb-3 font-bold">الشارات</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {d.achievements.map((a) => (
            <li key={a.code} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${a.earned ? 'border-accent/60 bg-accent/10' : 'opacity-50'}`}>
              <Award className={`mt-0.5 h-5 w-5 shrink-0 ${a.earned ? 'text-accent' : ''}`} aria-hidden />
              <div><p className="font-semibold">{a.title_ar}</p><p className="text-xs text-muted">{a.description_ar}</p></div>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="mb-3 flex items-center gap-2 font-bold"><Trophy className="h-4 w-4 text-accent" aria-hidden />لوحة الشرف</h2>
        {!board || (board as unknown[]).length === 0 ? (
          <p className="text-sm text-muted">لا أحد في الترتيب بعد. يمكنك الانضمام من صفحة «حسابي» (اختياري).</p>
        ) : (
          <ol className="divide-y">
            {(board as { name: string; xp: number; level: string; me: boolean }[]).map((r, i) => (
              <li key={i} className={`flex items-center justify-between py-2 text-sm ${r.me ? 'font-bold text-brand' : ''}`}>
                <span>{i + 1}. {r.name || 'متعلّم'} <span className="text-xs text-muted" dir="ltr">({r.level})</span></span>
                <span dir="ltr">{r.xp} XP</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
