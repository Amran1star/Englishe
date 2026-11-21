'use client'

import { useState } from 'react'
import type { Item } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { ExerciseRunner } from './exercise-runner'

/** تمارين تدريبية تُسجَّل في سجل النشاط عند إنهائها (دون نقاط، لأنها تُصحَّح في المتصفح). */
export function PracticeRunner({ items, practiceType }: { items: Item[]; practiceType: 'reading' | 'listening' | 'game_order' | 'writing' | 'pdf_quiz' | 'tutor' | 'pronunciation' | 'game_match' }) {
  const [logged, setLogged] = useState(false)
  return (
    <ExerciseRunner
      items={items}
      onFinish={(correct, total) => {
        if (logged) return
        setLogged(true)
        createClient().rpc('log_practice', { p_type: practiceType, p_score: correct, p_total: total }).then(() => undefined)
      }}
    />
  )
}
