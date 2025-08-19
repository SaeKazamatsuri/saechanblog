'use client'

import type { Category } from '@/lib/posts'
import { useToast } from '@/components/admin/ToastProvider'
import { buildTime } from '@/lib/buildInfo'

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

    // ビルド時刻を人間が読みやすい形式に整形
    const buildDate = new Date(buildTime).toLocaleString()

    return (
        <div className="space-y-4">
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

                <span className="text-gray-600">最終更新: {buildDate}</span>
            </div>
        </div>
    )
}
