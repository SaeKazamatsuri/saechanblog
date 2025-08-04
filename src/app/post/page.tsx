// 'use client' は付けない（このファイルは Server Component）
import { getSortedPostsData } from '@/lib/posts'
import Link from 'next/link'

export default function HomePage() {
    /* 1. サーバー側で記事データを取得 */
    const allPostsData = getSortedPostsData()

    /* 2. JSX 描画 */
    return (
        <section className="mx-auto max-w-3xl px-4 py-12">
            <h1 className="text-2xl font-bold mb-4">All Posts</h1>

            <ul>
                {allPostsData.map(
                    ({ id, category, categorySlug, date, title }) => (
                        <li
                            key={`${categorySlug}/${id}`}
                            className="mb-4"
                        >
                            {/* URL には英数字スラッグを使用 */}
                            <Link
                                href={`/post/${categorySlug}/${id}`}
                                className="text-xl text-blue-600 hover:underline"
                            >
                                {title}
                            </Link>

                            {/* （任意）カテゴリ名を表示したい場合はここで */}
                            <span className="ml-2 text-sm text-gray-600">
                                [{category}]
                            </span>

                            <br />

                            <small className="text-gray-500">{date}</small>
                        </li>
                    ),
                )}
            </ul>
        </section>
    )
}
