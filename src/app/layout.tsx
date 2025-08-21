import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import 'highlight.js/styles/github.css'
import ScrollToTop from '@/components/layout/ScrollToTop'
import IrisOverlay from '@/components/layout/IrisOverlay'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'ショートランドのこかげ',
    description: '風祭小枝のブログ',
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sae-chan.net'),
    openGraph: {
        type: 'website',
        siteName: 'ショートランドのこかげ',
        images: ['/og-default.png'],
    },
    twitter: {
        card: 'summary_large_image',
        creator: '@SaeKazamatsuri',
        images: ['/og-default.png'],
    },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <ScrollToTop />
                {children}
                <IrisOverlay />
            </body>
        </html>
    )
}
