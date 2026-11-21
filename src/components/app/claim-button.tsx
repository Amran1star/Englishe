'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function ClaimButton({ code, xp }: { code: string; xp: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  return (
    <div>
      <Button
        size="md"
        loading={loading}
        onClick={async () => {
          setLoading(true)
          setErr(null)
          const { error } = await createClient().rpc('claim_challenge', { p_code: code })
          setLoading(false)
          if (error) setErr('تعذّر استلام المكافأة.')
          else router.refresh()
        }}
      >
        استلم +{xp} XP
      </Button>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  )
}
