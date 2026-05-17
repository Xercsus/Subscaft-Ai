import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SubsCraft AI',
  description: 'AI Subtitle Generator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}