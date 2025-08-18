'use client'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-red-50 px-4">
            <h1 className="text-4xl font-bold text-red-700 mb-4">エラーが発生しました</h1>
            <p className="text-gray-700 mb-6">{error.message || '予期せぬエラーです。'}</p>
            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                >
                    再試行
                </button>
                <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                    ホームへ戻る
                </Link>
            </div>
        </main>
    )
}
