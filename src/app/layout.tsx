// app/layout.tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import "highlight.js/styles/github.css"

const geistSans = Geist({
	variable: "--font-geist-sans", // フォント変数
	subsets: ["latin"],
})

const geistMono = Geist_Mono({
	variable: "--font-geist-mono", // フォント変数
	subsets: ["latin"],
})

export const metadata: Metadata = {
	// 既定のタイトルと説明
	title: "ショートランドのこかげ",
	description: "風祭小枝のブログ",

	// 相対URLを絶対URLに解決するための基点
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sae-chan.net"),

	// Open Graph の既定
	openGraph: {
		type: "website", // 既定のタイプ
		siteName: "ショートランドのこかげ", // サイト名
		images: ["/og-default.png"], // 既定OG画像（public/og-default.png を配置）
	},

	// Twitterカードの既定
	twitter: {
		card: "summary_large_image", // 画像大きめカード
		// creator: "@your_twitter", // 任意で設定
		images: ["/og-default.png"], // 既定Twitter画像
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="ja">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				{children}
			</body>
		</html>
	)
}
