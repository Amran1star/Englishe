import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic, Space_Grotesk } from 'next/font/google'
import './globals.css'

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
})

const latin = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-latin',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'English Mastery — Master English, Step by Step.',
    template: '%s | English Mastery',
  },
  description:
    'منصة لتعلّم اللغة الإنجليزية من المستوى A0 إلى C1، بشرح عربي وتدريب تفاعلي.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F6FA' },
    { media: '(prefers-color-scheme: dark)', color: '#0B101C' },
  ],
}

// يُنفَّذ قبل الرسم لتفادي وميض الوضع الخاطئ
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${arabic.variable} ${latin.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}
