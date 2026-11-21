'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/** يسجّل وقت التعلم الفعلي (كل 30 ثانية والصفحة ظاهرة) لحساب الوقت المستغرق والهدف اليومي. */
export function LessonTimer({ lessonId }: { lessonId: string }) {
  useEffect(() => {
    const supabase = createClient()
    let last = Date.now()
    const tick = () => {
      if (document.visibilityState !== 'visible') {
        last = Date.now()
        return
      }
      const secs = Math.min(60, Math.round((Date.now() - last) / 1000))
      last = Date.now()
      if (secs > 0) supabase.rpc('track_time', { p_lesson_id: lessonId, p_seconds: secs }).then(() => undefined)
    }
    const t = setInterval(tick, 30000)
    return () => {
      clearInterval(t)
      tick()
    }
  }, [lessonId])
  return null
}
