import type { Metadata } from 'next'
import { requireUser } from '@/lib/session'
import { ProfileForm } from '@/components/app/profile-form'

export const metadata: Metadata = { title: 'حسابي' }

export default async function ProfilePage() {
  const { user, profile } = await requireUser('/profile')
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">حسابي</h1>
      <ProfileForm profile={profile} email={user.email ?? ''} />
    </div>
  )
}
