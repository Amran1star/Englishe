import { NextResponse } from 'next/server'
import { aiCall, extractJson, ApiError } from '@/lib/ai'
import { authed, fail, readJson } from '@/lib/api'

export async function POST(req: Request) {
  try {
    const { supabase } = await authed()
    const { word } = await readJson<{ word?: string }>(req, 2000)
    if (!word || !/^[A-Za-z'’-]{1,40}$/.test(word)) throw new ApiError(400, 'كلمة غير صالحة.')
    const text = await aiCall(supabase, {
      feature: 'translate',
      maxTokens: 150,
      system: 'You are an English-to-Arabic learner dictionary. Reply with ONLY a JSON object: {"translation_ar": short Arabic meaning, "pos": part of speech in English}.',
      messages: [{ role: 'user', content: word }],
    })
    const j = extractJson<{ translation_ar?: string; pos?: string }>(text)
    return NextResponse.json({ translation_ar: String(j.translation_ar ?? '').slice(0, 120), pos: String(j.pos ?? '').slice(0, 30) })
  } catch (e) {
    return fail(e)
  }
}
