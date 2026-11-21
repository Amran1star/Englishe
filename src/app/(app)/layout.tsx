import { AppNav } from '@/components/app/app-nav'
import { SpeechProvider } from '@/lib/speech'
import { requireUser } from '@/lib/session'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser()
  return (
    <SpeechProvider defaultAccent={profile.preferred_accent}>
      <AppNav isAdmin={profile.role === 'admin'} />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">{children}</main>
    </SpeechProvider>
  )
}
