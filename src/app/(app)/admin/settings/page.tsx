import { requireAdmin } from '@/lib/session'
import { SettingsEditor } from '@/components/admin/settings-editor'

export default async function AdminSettings() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('site_settings').select('key, value, is_public').order('key')
  return <SettingsEditor initial={data ?? []} />
}
