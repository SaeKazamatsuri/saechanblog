// 'use client' は付けない（Server Component）
import { getSortedPostsData } from '@/lib/posts'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = {
    params: Promise<{ category: string }>
}


export default async function CategoryPage({ params }: Props) {
    /* 1. URL パラメータ（英数字 slug）を取得 */
    const categorySlug = (await params).category

    /* 2. 全記事読み出し（サーバー側で fs 使用）*/
    const allPosts = getSortedPostsData()

    /* 3. slug でフィルタリング */
    const filtered = allPosts.filter(
        (post) => post.categorySlug === categorySlug,
    )

    /* 4. 該当なしなら 404 */
    if (filtered.length === 0) notFound()

    /* 5. 日本語カテゴリ名は 先頭の記事から取得 */
    const displayName = filtered[0].category

    /* 6. ページ描画 */
    return (
        <section className="mx-auto max-w-3xl px-4 py-12">
            <h1 className="text-2xl font-bold mb-4">
                {displayName} Posts
            </h1>

            <ul>
                {filtered.map(({ id, title, date }) => (
                    <li key={id} className="mb-4">
                        <Link
                            href={`/post/${categorySlug}/${id}`}
                            className="text-xl text-blue-600 hover:underline"
                        >
                            {title}
                        </Link>
                        <br />
                        <small className="text-gray-500">{date}</small>
                    </li>
                ))}
            </ul>
        </section>
    )
}

/* ────────── SSG 用 ────────── */
export async function generateStaticParams() {
    const posts = getSortedPostsData()
    const slugs = Array.from(new Set(posts.map((p) => p.categorySlug)))
    return slugs.map((slug) => ({ category: slug }))
}
