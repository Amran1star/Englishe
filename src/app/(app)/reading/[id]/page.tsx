import type { Metadata } from 'next'
import { TextDetail } from '@/components/reading/text-views'

export const metadata: Metadata = { title: 'نص للقراءة' }
export default function ReadingDetail({ params }: { params: { id: string } }) {
  return <TextDetail id={params.id} mode="read" />
}
