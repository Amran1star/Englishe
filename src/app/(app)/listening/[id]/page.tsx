import type { Metadata } from 'next'
import { TextDetail } from '@/components/reading/text-views'

export const metadata: Metadata = { title: 'تمرين استماع' }
export default function ListeningDetail({ params }: { params: { id: string } }) {
  return <TextDetail id={params.id} mode="listen" />
}
