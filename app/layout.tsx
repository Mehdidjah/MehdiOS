import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Taskbar } from './components/taskbar'
import { ReduxProvider } from './providers/redux-provider'
import { Topbar } from './components/topbar'
import { WalpaperProvider } from './components/walpaper-wraper'
import { ThemeProvider } from 'next-themes'

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
)

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: 'MehdiOS',
  description: 'Creating macOS version as portfolio',
  metadataBase,
  openGraph: {
    title: 'MehdiOS',
    description: 'Creating macOS version as portfolio',
    images: [
      {
        url: '/assets/background/macos-tahoe.jpg',
        width: 1200,
        height: 630,
        alt: 'MehdiOS - macOS Portfolio',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MehdiOS',
    description: 'Creating macOS version as portfolio',
    images: ['/assets/background/macos-tahoe.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body className="h-screen overflow-hidden overflow-x-hidden max-w-full">
        <ReduxProvider>
          <ThemeProvider
            enableSystem
            attribute="class"
            disableTransitionOnChange
          >
            <WalpaperProvider />
            <Topbar />
            {children}
            <Taskbar />
            <div id="modal" />
            <div id="context-menu" />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}
