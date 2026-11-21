import Link from 'next/link'
import { BookOpenCheck, Bot, FileUp, Layers, Trophy, Volume2 } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { buttonStyles } from '@/components/ui/button'
import { LEVELS } from '@/lib/levels'

const FEATURES = [
  { icon: BookOpenCheck, title: 'منهج متدرج من A0 إلى C1', text: 'وحدات ودروس مرتبة وفق إطار CEFR، بشرح عربي وأمثلة مترجمة.' },
  { icon: Volume2, title: 'نطق واستماع', text: 'استمع للكلمات والجمل بلكنة أمريكية أو بريطانية وبالسرعة التي تناسبك.' },
  { icon: Bot, title: 'مدرّس ذكي', text: 'تحدّث بالإنجليزية بمستواك، ويصحح لك أخطاءك ويشرحها بالعربية.' },
  { icon: FileUp, title: 'من PDF إلى اختبار', text: 'ارفع ملفك واحصل على اختبار تفاعلي مبني على محتواه فقط.' },
  { icon: Layers, title: 'مفردات ومراجعة متباعدة', text: 'بطاقات تعلّم تعيد إليك الكلمة قبل أن تنساها.' },
  { icon: Trophy, title: 'تقدم وتحفيز', text: 'نقاط وشارات وتحديات، وتقدمك محفوظ ومتزامن بين أجهزتك.' },
]

const STEPS = [
  { title: 'أنشئ حسابك', text: 'بالبريد الإلكتروني وكلمة مرور، دون خطوات معقدة.' },
  { title: 'ابدأ من مستواك', text: 'من الصفر تماماً أو من المستوى الذي تعرفه.' },
  { title: 'تعلّم خطوة بخطوة', text: 'ولا يُفتح المستوى التالي إلا بعد اجتياز الحالي.' },
]

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-2 md:pt-20">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl" dir="ltr">
              Master English,
              <br />
              Step by Step.
            </h1>
            <p className="max-w-md text-lg leading-8 text-muted">
              تعلّم الإنجليزية بالعربية من أول حرف حتى المستوى المتقدم، بدروس مرتبة وتمارين تصحّح لك فوراً.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className={buttonStyles('primary', 'lg')}>ابدأ التعلم</Link>
              <a href="#levels" className={buttonStyles('secondary', 'lg')}>شاهد المستويات</a>
            </div>
          </div>

          {/* السلّم: ست درجات ترتفع من A0 إلى C1 */}
          <div aria-label="مستويات التعلم من A0 إلى C1" role="img" className="relative">
            <div className="flex h-64 items-end gap-2 sm:h-80" dir="rtl">
              {LEVELS.map((l, i) => (
                <div
                  key={l.code}
                  style={{ height: `${28 + i * 14}%`, animationDelay: `${i * 90}ms` }}
                  className={`flex flex-1 origin-bottom animate-rise flex-col justify-end rounded-t-xl p-2.5 sm:p-3 ${
                    i === 0 ? 'bg-accent text-black' : 'bg-brand text-brand-fg'
                  }`}
                >
                  <span className="text-lg font-bold sm:text-xl" dir="ltr">{l.code}</span>
                  <span className="text-[11px] leading-4 opacity-90 sm:text-xs">{l.titleAr}</span>
                </div>
              ))}
            </div>
            <div className="h-1.5 rounded-full bg-fg/15" />
          </div>
        </section>

        {/* Levels */}
        <section id="levels" className="border-y bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">ست مراحل، وجهة واحدة</h2>
            <p className="mt-2 max-w-xl text-muted">مبنية على المستويات الدولية CEFR المعتمدة في اختبارات اللغة.</p>
            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LEVELS.map((l) => (
                <li key={l.code} className="flex items-center gap-4 rounded-2xl border bg-bg p-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-lg font-bold text-brand" dir="ltr">
                    {l.code}
                  </span>
                  <div>
                    <p className="font-semibold">{l.titleAr}</p>
                    <p className="text-sm text-muted" dir="ltr">{l.titleEn}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">كل ما تحتاجه في مكان واحد</h2>
          <p className="mt-2 max-w-xl text-muted">تُضاف هذه المزايا تباعاً، وما زال العمل جارياً عليها.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border bg-surface p-5">
                <div className="flex items-start justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted">قريباً</span>
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-7 text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How */}
        <section id="how" className="border-t bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">كيف تبدأ</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4 rounded-2xl border bg-bg p-5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-fg" dir="ltr">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-7 text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-10">
              <Link href="/register" className={buttonStyles('primary', 'lg')}>أنشئ حسابك الآن</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
