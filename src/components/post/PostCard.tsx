// 単一の投稿カード（エリア全体をリンク）
import Link from 'next/link'
import Image from 'next/image'
import { getCoverUrl } from '@/lib/posts'

// 投稿データ型
export type Post = {
    id: string // 投稿ID
    category: string // カテゴリ表示名
    categorySlug: string // カテゴリスラッグ
    date: string // 公開日(文字列)
    title: string // タイトル
    description?: string // 説明
    cover?: string // カバー画像ファイル名等
}

// プロパティ
type Props = {
    post: Post // 表示対象の投稿
    imagePriority?: boolean // 画像優先読み込み
}

// レイアウト: モバイル1列、md以上で画像+テキスト横並び（OGP比率固定）
export default function PostCard({ post, imagePriority = false }: Props) {
    const coverUrl = getCoverUrl?.(post.categorySlug, post.cover) // カバー画像URL

    return (
        <li className="border-b pb-8 last:border-b-0">
            <Link
                href={`/post/${post.categorySlug}/${post.id}`}
                aria-label={`「${post.title}」へ`} // リンク先説明
                className="group block rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:bg-gray-100"
            >
                <article className="grid gap-4 items-stretch md:grid-cols-12">
                    <div className="relative aspect-[1200/630] md:col-span-5 lg:col-span-4 overflow-hidden rounded border">
                        {' '}
                        {/* OGP比率(1200:630) */}
                        {coverUrl ? (
                            <Image
                                src={coverUrl}
                                alt={`${post.title} のカバー画像`} // 画像代替テキスト
                                fill // 画像を親コンテナにフィット
                                className="object-cover" // 中央トリミング
                                sizes="(min-width: 1280px) 400px, (min-width: 1024px) 340px, (min-width: 768px) 36vw, 100vw" // レスポンシブヒント
                                priority={imagePriority}
                            />
                        ) : (
                            <div className="h-full w-full bg-gray-100" /> // 画像なし時もOGP比率を維持
                        )}
                    </div>

                    <div className="min-w-0 md:col-span-7 lg:col-span-8 p-1">
                        <h3 className="text-lg md:text-xl font-semibold text-blue-600 underline-offset-4 group-hover:underline break-words line-clamp-2 md:line-clamp-none">
                            {post.title}
                        </h3>

                        <div className="mt-1 text-xs md:text-sm text-gray-600 flex flex-wrap items-center gap-x-2">
                            <span>[{post.category}]</span>
                            <span className="text-gray-500">{post.date}</span>
                        </div>

                        {post.description ? (
                            <p className="mt-3 text-sm md:text-base text-gray-700 leading-relaxed line-clamp-2 md:line-clamp-3 break-words overflow-hidden">
                                {post.description}
                            </p>
                        ) : null}
                    </div>
                </article>
            </Link>
        </li>
    )
}
