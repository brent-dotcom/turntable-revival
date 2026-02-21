import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Turntable Revival',
  description: 'Social music rooms — DJ, vote, and vibe with friends',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎵</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-primary text-text-primary">
        {children}
      </body>
    </html>
  )
}
