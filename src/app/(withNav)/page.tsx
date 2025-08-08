import { getSortedPostsData, getCoverUrl } from '@/lib/posts'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
	// 全投稿データ
	const allPostsData = getSortedPostsData()

	return (
		<section className="mx-auto max-w-3xl px-4 py-12">
			{/* タイトル見出し */}
			<h1 className="text-2xl font-bold mb-6">All Posts</h1>

			<ul className="space-y-8">
				{allPostsData.map(({ id, category, categorySlug, date, title, description, cover }) => {
					// カバー画像URL
					const coverUrl = getCoverUrl(categorySlug, cover)

					return (
						<li
							key={`${categorySlug}/${id}`}
							className="border-b pb-6"
						>
							{/* コンテンツレイアウト（モバイル1列、MD以上2列） */}
							<div className="grid grid-cols-1 md:grid-cols-[minmax(180px,320px)_1fr] gap-4 items-start">
								{/* 左：画像（必要なときだけ表示） */}
								{coverUrl ? (
									<Link href={`/post/${categorySlug}/${id}`} className="block">
										<Image
											src={coverUrl}
											alt={`${title} のOGP画像`}
											width={640}  // 画像ベース幅
											height={336} // 1200x630相当の比率
											className="w-full h-auto max-w-[320px] md:max-w-[320px] rounded border"
											sizes="(min-width: 768px) 320px, 100vw" // レスポンシブ最適化
											priority={false}
										/>
									</Link>
								) : (
									<div className="hidden md:block w-full max-w-[320px] aspect-[1200/630] rounded border bg-gray-100" />
								)}

								{/* 右：テキストブロック */}
								<div>
									{/* タイトル */}
									<Link
										href={`/post/${categorySlug}/${id}`}
										className="text-xl font-semibold text-blue-600 hover:underline"
									>
										{title}
									</Link>

									{/* メタ情報 */}
									<div className="mt-1 text-sm text-gray-600">
										<span>[{category}]</span>
										<span className="ml-2 text-gray-500">{date}</span>
									</div>

									{/* ディスクリプション */}
									{description && (
										<p className="mt-3 text-gray-700 leading-relaxed">
											{description}
										</p>
									)}
								</div>
							</div>
						</li>
					)
				})}
			</ul>
		</section>
	)
}
