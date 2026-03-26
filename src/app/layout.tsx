import type { Metadata, Viewport } from 'next'
import { Nunito_Sans } from 'next/font/google'
import './globals.css'
import Footer from '@/components/layout/Footer'
import { AppHeader } from '@/components/layout/AppHeader'

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '800', '900'],
  variable: '--font-nunito-sans',
})

export const metadata: Metadata = {
  title: 'FondosFinder — UNGRD',
  description: 'Buscador de fuentes de financiamiento para gestión del riesgo de desastres',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#213362',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" style={{ colorScheme: 'light' }}>
      <body className={`${nunitoSans.variable} font-sans bg-gray-50 antialiased`}>
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
