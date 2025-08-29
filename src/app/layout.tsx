import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import 'highlight.js/styles/github.css'
import ScrollToTop from '@/components/layout/ScrollToTop'

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
    description:
        '風祭小枝のブログ。主にサークル「ショートランドのこかげ」の宣伝をおこないます。\
		また、技術的なメモや開発している同人誌管理システム「読ん棚」の進捗を報告します。\
		更新頻度はマイペースなので、気長にお待ちください。',
    keywords: ['ショートランドのこかげ', '風祭小枝', '読ん棚', '個人開発'],
    creator: '風祭小枝',
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sae-chan.net'),
    openGraph: {
        type: 'website',
        siteName: 'ショートランドのこかげ',
        title: 'ショートランドのこかげ',
        description: '風祭小枝のブログ。主にサークル「ショートランドのこかげ」の宣伝をおこないます。',
        images: ['/image/ogp.jpg'],
        locale: 'ja_JP',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ショートランドのこかげ',
        description: '風祭小枝のブログ',
        creator: '@SaeKazamatsuri',
        images: ['/image/ogp.jpg'],
    },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <ScrollToTop />
                {children}
            </body>
        </html>
    )
}
