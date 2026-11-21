import type { Metadata } from 'next'
import { TextList } from '@/components/reading/text-views'

export const metadata: Metadata = { title: 'القراءة' }
export default function ReadingPage() {
  return <TextList mode="read" />
}
