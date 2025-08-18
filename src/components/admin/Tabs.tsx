'use client'

import { memo } from 'react'

// 機能: タブ切替UI
export type Tab = 'post' | 'image' | 'seo'

type Props = {
    active: Tab
    onChange: (t: Tab) => void
}

function TabsImpl({ active, onChange }: Props) {
    // 変数: タブ定義
    const items: { id: Tab; label: string }[] = [
        { id: 'post', label: '投稿' },
        { id: 'image', label: '画像' },
        { id: 'seo', label: 'SEO' },
    ]

    return (
        <div className="flex border-b border-gray-300 mb-4">
            {items.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onChange(t.id)}
                    className={`px-4 py-2 -mb-px border-b-2 text-sm
            ${
                active === t.id
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
            }`}
                >
                    {t.label}
                </button>
            ))}
        </div>
    )
}

export const Tabs = memo(TabsImpl)
