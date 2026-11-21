'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function signOut() {
    setLoading(true)
    try {
      await createClient().auth.signOut()
    } finally {
      router.replace('/')
      router.refresh()
    }
  }

  return (
    <Button variant="secondary" onClick={signOut} loading={loading}>
      {!loading && <LogOut className="h-4 w-4" aria-hidden />}
      تسجيل الخروج
    </Button>
  )
}
