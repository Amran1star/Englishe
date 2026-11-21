import type { InputHTMLAttributes } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export function Field({ label, hint, id, className = '', ...props }: FieldProps) {
  const fieldId = id ?? props.name
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={fieldId}
        className={`h-11 w-full rounded-xl border bg-surface px-3.5 text-base placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 ${className}`}
        {...props}
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
