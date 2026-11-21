import { requireAdmin } from '@/lib/session'
import { UsersTable } from '@/components/admin/users-table'
import { Alert } from '@/components/ui/alert'

export default async function AdminUsers() {
  const { supabase, user } = await requireAdmin()
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) return <Alert kind="error">تعذّر تحميل المستخدمين.</Alert>
  return <UsersTable users={data ?? []} meId={user.id} />
}
