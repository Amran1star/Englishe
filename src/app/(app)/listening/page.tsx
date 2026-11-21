import type { Metadata } from 'next'
import { TextList } from '@/components/reading/text-views'

export const metadata: Metadata = { title: 'الاستماع' }
export default function ListeningPage() {
  return <TextList mode="listen" />
}
