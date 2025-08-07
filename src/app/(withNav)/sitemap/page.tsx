import Link from 'next/link'
import { staticRoutes } from '@/lib/staticRoutes'
import { getSortedPostsData } from '@/lib/posts'

export default async function SitemapPage() {

	const posts = getSortedPostsData()


	const grouped = posts.reduce((acc, post) => {
		; (acc[post.category] ??= []).push(post)
		return acc
	}, {} as Record<string, typeof posts>)


	return (
		<div className="mx-auto max-w-3xl px-4 py-12">
			{ }
			<section className="text-center mb-16">
				<h1 className="text-4xl font-bold tracking-tight">サイトマップ</h1>
			</section>

			{ }
			<section className="mb-8">
				<h2 className="scroll-mt-24 text-2xl sm:text-3xl font-bold mt-12 mb-4 pb-2 border-b-2 border-blue-200/80 text-blue-800">
					固定ページ
				</h2>
				<ul className="list-disc list-inside space-y-1">
					{staticRoutes.map((route) => (
						<li key={route.path}>
							<Link href={route.path} className="text-blue-600 hover:underline">
								{route.name}
							</Link>
						</li>
					))}
				</ul>
			</section>

			{ }
			<section>
				<h2 className="scroll-mt-24 text-2xl sm:text-3xl font-bold mt-12 mb-4 pb-2 border-b-2 border-blue-200/80 text-blue-800">
					ブログ記事
				</h2>

				{Object.entries(grouped).map(([jpName, categoryPosts]) => (
					<div key={jpName} className="mb-4">
						{ }
						<h3 className="scroll-mt-24 text-xl sm:text-2xl font-semibold mt-10 mb-3 text-blue-800">
							{jpName}
						</h3>

						{ }
						<ul className="list-disc list-inside ml-4 space-y-1">
							{categoryPosts.map((post) => (
								<li key={post.id}>
									<Link

										href={`/post/${post.categorySlug}/${post.id}`}
										className="text-blue-600 hover:underline"
									>
										{post.title}
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</section>
		</div>
	)
}
