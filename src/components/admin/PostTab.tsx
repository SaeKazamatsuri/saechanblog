'use client'

import type { Category } from '@/lib/posts'
import { useToast } from '@/components/admin/ToastProvider'

// 機能: 投稿タブ（カテゴリ/タイトル/日付/ファイル名/投稿・下書き保存・サーバ更新）
type Props = {
    categories: Category[]
    category: string
    setCategory: (v: string) => void
    title: string
    setTitle: (v: string) => void
    date: string
    setDate: (v: string) => void
    filename: string
    setFilename: (v: string) => void
    onPost: () => void
    onSaveDraft: () => void
}

export default function PostTab({
    categories,
    category,
    setCategory,
    title,
    setTitle,
    date,
    setDate,
    filename,
    setFilename,
    onPost,
    onSaveDraft,
}: Props) {
    const pushToast = useToast()

    // サーバ更新処理
    const onRebuild = async () => {
        try {
            const res = await fetch('/api/rebuild', { method: 'POST' })
            if (res.ok) {
                pushToast('サーバ更新を開始しました')
            } else {
                pushToast('サーバ更新に失敗しました')
            }
        } catch {
            pushToast('サーバ更新エラー')
        }
    }

    return (
        <div className="space-y-4">
            {/* 1段目: カテゴリ / タイトル */}
            <div className="flex flex-wrap items-center gap-4">
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-[40px] px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                            {c.displayName}
                        </option>
                    ))}
                </select>

                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="タイトル"
                    className="h-[40px] flex-grow px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            {/* 2段目: 日付 / ファイル名 + 操作ボタン */}
            <div className="flex flex-wrap items-center gap-4">
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-[40px] px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="ファイル名"
                    className="h-[40px] flex-grow px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                <button
                    onClick={onPost}
                    className="h-[40px] bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-sm"
                >
                    投稿
                </button>

                <button
                    onClick={onSaveDraft}
                    className="h-[40px] bg-gray-600 hover:bg-gray-700 transition text-white px-4 py-2 rounded-sm"
                >
                    下書き保存
                </button>

                <button
                    onClick={onRebuild}
                    className="h-[40px] bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded-sm"
                >
                    サーバ更新
                </button>
            </div>
        </div>
    )
}
