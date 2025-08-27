'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

export default function RedirectPage() {
    const params = useSearchParams()
    const to = params.get('to')

    const handleProceed = () => {
        if (to) window.location.href = to
    }

    const handleCancel = () => {
        window.close()
    }

    return (
        <Suspense fallback={<div className="pt-12 text-center">読み込み中…</div>}>
            <div className="pt-12 text-center">
                <p className="text-lg font-semibold mb-4">外部サイトに移動します。よろしいですか？</p>
                {to && (
                    <p className="text-sm text-gray-600 mb-6 break-all">
                        移動先:{' '}
                        <a href={to} target="_blank" rel="noopener noreferrer" className="text-blue-800 underline">
                            {to}
                        </a>
                    </p>
                )}
                <div className="flex justify-center gap-6">
                    <button
                        onClick={handleProceed}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-800 transition"
                    >
                        はい
                    </button>
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                    >
                        いいえ
                    </button>
                </div>
            </div>
        </Suspense>
    )
}
