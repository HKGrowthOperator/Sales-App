import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HK Sales Cockpit',
  description: 'Rollenbasiertes Sales-Tool für Opener, Setter und Closer',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
