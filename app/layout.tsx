import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'California Sustainability Simulation Platform',
  description: 'AI-Native Infrastructure Reasoning Engine',
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
