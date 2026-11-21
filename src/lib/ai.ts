import type { SupabaseClient } from '@supabase/supabase-js'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

interface AiParams {
  feature: string
  system: string
  messages: { role: 'user' | 'assistant'; content: unknown }[]
  maxTokens?: number
}

/** يستدعي نموذج الذكاء الاصطناعي من الخادم فقط (المفتاح لا يصل للمتصفح) ويسجّل الاستهلاك ويطبّق الحد اليومي. */
export async function aiCall(supabase: SupabaseClient, p: AiParams): Promise<string> {
  const key = process.env.AI_API_KEY
  if (!key) throw new ApiError(503, 'خدمة الذكاء الاصطناعي غير مفعّلة بعد. أضف AI_API_KEY في إعدادات الخادم.')

  const { data: quota, error: qErr } = await supabase.rpc('ai_quota')
  if (qErr) throw new ApiError(500, 'تعذّر التحقق من الحد اليومي.')
  if (quota && quota.used >= quota.limit) {
    throw new ApiError(429, `وصلت إلى الحد اليومي لاستخدام الذكاء الاصطناعي (${quota.limit} طلباً). جرّب غداً.`)
  }

  const model = process.env.AI_MODEL || 'claude-sonnet-5-5'
  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: p.maxTokens ?? 1500, system: p.system, messages: p.messages }),
    })
  } catch {
    throw new ApiError(502, 'تعذّر الاتصال بخدمة الذكاء الاصطناعي.')
  }
  if (!res.ok) {
    if (res.status === 401) throw new ApiError(503, 'مفتاح الذكاء الاصطناعي غير صالح.')
    if (res.status === 429 || res.status === 529) throw new ApiError(503, 'الخدمة مشغولة الآن. أعد المحاولة بعد قليل.')
    if (res.status === 413 || res.status === 400) throw new ApiError(422, 'تعذّرت معالجة الطلب (قد يكون الملف كبيراً أو عدد صفحاته أكثر من المسموح).')
    throw new ApiError(502, 'فشل طلب الذكاء الاصطناعي.')
  }
  const data = await res.json()
  const text: string = (data.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('')
  await supabase.rpc('log_ai_usage', {
    p_feature: p.feature,
    p_model: model,
    p_in: data.usage?.input_tokens ?? 0,
    p_out: data.usage?.output_tokens ?? 0,
  })
  return text
}

export function extractJson<T = unknown>(text: string): T {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new ApiError(502, 'رد غير مفهوم من الذكاء الاصطناعي. أعد المحاولة.')
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T
  } catch {
    throw new ApiError(502, 'رد غير مكتمل من الذكاء الاصطناعي. أعد المحاولة.')
  }
}
