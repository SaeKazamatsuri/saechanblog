'use client'

// 機能: 右側のプレビュー表示
type Props = {
    title: string
    date: string
    tags: string[]
}

export default function PreviewPanel({ title, date, tags }: Props) {
    return (
        <div className="w-full lg:w-1/2 mt-4 lg:mt-0 ">
            <div className="border-b border-blue-200 pb-6 pt-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-900 tracking-tight">
                    {title || 'タイトル未入力'}
                </h1>
            </div>

            <p className="mt-3 text-base text-blue-600">{date || '日付未入力'}</p>

            {tags.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                    {tags.map((t) => (
                        <li key={t} className="text-xs sm:text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                            {t}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
