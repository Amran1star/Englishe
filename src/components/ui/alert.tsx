import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

type Kind = 'error' | 'success' | 'info'

const styles: Record<Kind, string> = {
  error: 'border-red-300 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200',
  info: 'border-brand/30 bg-brand-soft text-fg',
}

const icons = { error: AlertTriangle, success: CheckCircle2, info: Info }

export function Alert({ kind = 'info', children }: { kind?: Kind; children: React.ReactNode }) {
  const Icon = icons[kind]
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm leading-relaxed ${styles[kind]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
