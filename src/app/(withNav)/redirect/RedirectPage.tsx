'use client'

import React, { useCallback } from 'react'

type Props = { to?: string }

function isSafeExternalUrl(v?: string): v is string {
    if (!v) return false
    try {
        const u = new URL(v)
        return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
        return false
    }
}

export default function RedirectPage({ to }: Props) {
    const safe = isSafeExternalUrl(to) ? to! : ''

    const handleProceed = useCallback(() => {
        if (safe) window.location.assign(safe)
    }, [safe])

    const handleCancel = useCallback(() => {
        if (window.opener) window.close()
        else window.history.back()
    }, [])

    return (
        <div className="pt-12 text-center">
            <p className="text-lg font-semibold mb-4">外部サイトに移動します。よろしいですか？</p>
            {safe && (
                <p className="text-sm text-gray-600 mb-6 break-all">
                    移動先:{' '}
                    <a href={safe} target="_blank" rel="noopener noreferrer" className="text-blue-800 underline">
                        {safe}
                    </a>
                </p>
            )}
            <div className="flex justify-center gap-6">
                <button
                    onClick={handleProceed}
                    className="px-6 py-2 bg-blue-800 text-white rounded hover:bg-blue-800 transition"
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
    )
}
