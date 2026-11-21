import { requireAdmin } from '@/lib/session'
import { ContentManager } from '@/components/admin/content-manager'

export default async function AdminContent() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase
    .from('units')
    .select('id, level_code, title_en, title_ar, is_published, sort_order, lessons(id, slug, title_en, title_ar, objective_ar, is_published, sort_order, content)')
    .order('level_code')
    .order('sort_order')
  return <ContentManager initial={data ?? []} />
}
