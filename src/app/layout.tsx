import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { TranslationProvider } from '@/i18n'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Staywise - Modern Hotel Management System',
  description: 'Comprehensive web platform for managing hotel chain operations including rooms, reservations, guests, and financial control.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TranslationProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
