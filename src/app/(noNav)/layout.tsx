import Link from 'next/link'
import { ToastProvider } from '@/components/admin/ToastProvider'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
}

export default function NoNavLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen">
            <Link
                href="/"
                className="absolute top-6 right-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
                ホームへ戻る
            </Link>
            <ToastProvider>{children}</ToastProvider>
        </div>
    )
}
