import type { Metadata, Viewport } from 'next'
import { Nunito_Sans } from 'next/font/google'
import './globals.css'
import { LightSessionProvider } from '@/context/LightSessionContext'
import AccessGate from '@/components/access/AccessGate'
import { AppHeader } from '@/components/layout/AppHeader'
import Footer from '@/components/layout/Footer'
import { NavigationLoader } from '@/components/ui/NavigationLoader'
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget'

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '800', '900'],
  variable: '--font-nunito-sans',
  // Desactiva el cálculo automático de métricas de fallback. Next 14.2.35
  // no incluye overrides para "Nunito Sans" y provoca el error de build.
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: 'Herramienta — UNGRD',
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
        <LightSessionProvider>
          <AccessGate>
            <div className="min-h-screen flex flex-col">
              <AppHeader />
              <main className="flex-1">{children}</main>
              <Footer />
              <FeedbackWidget />
              <NavigationLoader />
            </div>
          </AccessGate>
        </LightSessionProvider>
      </body>
    </html>
  )
}
