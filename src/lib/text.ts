import type { Answer, Item } from './types'

export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.?!,;:]+$/, '')
    .trim()
}

function accepted(item: Item): string[] {
  const base = Array.isArray(item.a) ? item.a : typeof item.a === 'string' ? [item.a] : []
  return [...base, ...(item.acc ?? [])]
}

export function gradeItem(item: Item, v: Answer | undefined): boolean {
  if (v === undefined || v === null || v === '') return false
  switch (item.t) {
    case 'mcq':
      return typeof v === 'number' && v === item.a
    case 'tf':
      return typeof v === 'boolean' && v === item.a
    case 'fill':
    case 'short':
      return typeof v === 'string' && accepted(item).some((x) => norm(x) === norm(v))
    case 'order':
      return typeof v === 'string' && norm(v) === norm(String(item.a))
    case 'matching':
      return typeof v === 'object' && (item.pairs ?? []).every((p) => v[p.left] === p.right)
    default:
      return false
  }
}

export function correctText(item: Item): string {
  switch (item.t) {
    case 'mcq':
      return typeof item.a === 'number' ? item.o?.[item.a] ?? '' : ''
    case 'tf':
      return item.a ? 'صح' : 'خطأ'
    case 'matching':
      return (item.pairs ?? []).map((p) => `${p.left} = ${p.right}`).join(' | ')
    default:
      return accepted(item)[0] ?? ''
  }
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** تقارن كلمات النطق المستهدف بما سمعه المتصفح (LCS) وتعيد حالة كل كلمة ونسبة التطابق. */
export function compareSpeech(target: string, heard: string) {
  const clean = (s: string) =>
    s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean)
  const t = clean(target)
  const h = clean(heard)
  const dp: number[][] = Array.from({ length: t.length + 1 }, () => Array(h.length + 1).fill(0))
  for (let i = 1; i <= t.length; i++)
    for (let j = 1; j <= h.length; j++)
      dp[i][j] = t[i - 1] === h[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
  const ok = Array(t.length).fill(false)
  let i = t.length
  let j = h.length
  while (i > 0 && j > 0) {
    if (t[i - 1] === h[j - 1]) {
      ok[i - 1] = true
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--
    else j--
  }
  const matched = ok.filter(Boolean).length
  return { words: t.map((w, k) => ({ word: w, ok: ok[k] as boolean })), score: t.length ? Math.round((matched / t.length) * 100) : 0 }
}
