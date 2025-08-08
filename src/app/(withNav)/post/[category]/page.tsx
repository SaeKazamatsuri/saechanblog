import { getSortedPostsData, getCoverUrl } from '@/lib/posts' // データ取得・画像URL生成
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

type Props = {
	params: Promise<{ category: string }> // ルートパラメータ
}

export default async function CategoryPage({ params }: Props) {
	// カテゴリースラッグ
	const categorySlug = (await params).category

	// 全投稿
	const allPosts = getSortedPostsData()

	// 対象カテゴリのみ
	const filtered = allPosts.filter((post) => post.categorySlug === categorySlug)

	// 0件なら404
	if (filtered.length === 0) notFound()

	// 表示名
	const displayName = filtered[0].category

	return (
		<section className="mx-auto max-w-3xl px-4 py-12">
			<h1 className="text-2xl font-bold mb-6">{displayName} Posts</h1>

			<ul className="space-y-8">
				{filtered.map((post) => {
					// サムネURL
					const coverUrl = getCoverUrl?.(categorySlug, post.cover)

					return (
						<li key={post.id} className="border-b pb-6">
							{/* レイアウト：モバイル1列、MD以上2列（左固定幅） */}
							<div className="grid grid-cols-1 md:grid-cols-[minmax(180px,260px)_1fr] gap-4 items-start">
								{/* 左：画像（ある場合のみ） */}
								{coverUrl ? (
									<Link href={`/post/${categorySlug}/${post.id}`} className="block">
										<Image
											src={coverUrl}
											alt={`${post.title} のOGP画像`}
											width={520}    // 画像のベース幅
											height={273}   // 1200x630比率相当
											className="w-full h-auto max-w-[260px] md:max-w-[260px] rounded border"
											sizes="(min-width: 768px) 260px, 100vw" // レスポンシブヒント
											priority={false}
										/>
									</Link>
								) : null}

								{/* 右：本文 */}
								<div>
									<Link
										href={`/post/${categorySlug}/${post.id}`}
										className="text-xl font-semibold text-blue-600 hover:underline"
									>
										{post.title}
									</Link>

									<div className="mt-1 text-sm text-gray-600">
										<span className="text-gray-500">{post.date}</span>
									</div>

									{post.description ? (
										<p className="mt-3 text-gray-700 leading-relaxed line-clamp-3">
											{post.description}
										</p>
									) : null}
								</div>
							</div>
						</li>
					)
				})}
			</ul>
		</section>
	)
}

export async function generateStaticParams() {
	// 静的生成用のカテゴリ一覧
	const posts = getSortedPostsData()
	const slugs = Array.from(new Set(posts.map((p) => p.categorySlug)))
	return slugs.map((slug) => ({ category: slug }))
}
