import { getSortedPostsData, getCoverUrl } from '@/lib/posts' // データ取得と画像URL生成
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
	// 全投稿データ
	const allPostsData = getSortedPostsData() // 配列: id, category, categorySlug, date, title, description?, cover?

	return (
		<section className="mx-auto max-w-3xl px-4 py-12">
			<h1 className="text-2xl font-bold mb-6">All Posts</h1>

			<ul className="space-y-8">
				{allPostsData.map(({ id, category, categorySlug, date, title, description, cover }) => {
					// カバー画像URL
					const coverUrl = getCoverUrl?.(categorySlug, cover)

					return (
						<li key={`${categorySlug}/${id}`} className="border-b pb-6">
							{/* レイアウト: モバイル1列、MD以上2列 */}
							<div className="grid grid-cols-1 md:grid-cols-[minmax(180px,260px)_1fr] gap-4 items-start">
								{/* 左: サムネイル */}
								{coverUrl ? (
									<Link href={`/post/${categorySlug}/${id}`} className="block">
										<Image
											src={coverUrl}
											alt={`${title} のOGP画像`}
											width={520}   // 画像実サイズ
											height={273}  // 1200x630比率相当
											className="w-full h-auto max-w-[260px] md:max-w-[260px] rounded border"
											sizes="(min-width: 768px) 260px, 100vw" // レスポンシブヒント
											priority={false}
										/>
									</Link>
								) : null}

								{/* 右: テキストブロック */}
								<div>
									<Link
										href={`/post/${categorySlug}/${id}`}
										className="text-xl font-semibold text-blue-600 hover:underline"
									>
										{title}
									</Link>

									<div className="mt-1 text-sm text-gray-600">
										<span>[{category}]</span>
										<span className="ml-2 text-gray-500">{date}</span>
									</div>

									{description ? (
										<p className="mt-3 text-gray-700 leading-relaxed line-clamp-3">
											{description}
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
