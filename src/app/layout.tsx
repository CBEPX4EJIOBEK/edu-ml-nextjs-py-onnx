import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '../components/ui/Navigation'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Edu ML',
  description: 'Educational ML Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Navigation />
        <div className="ml-60 min-h-screen bg-gray-900 dark:bg-gray-900">
          {children}
        </div>
      </body>
    </html>
  )
}
