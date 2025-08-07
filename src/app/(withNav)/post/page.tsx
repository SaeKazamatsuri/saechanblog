
import { getSortedPostsData } from '@/lib/posts'
import Link from 'next/link'

export default function HomePage() {

	const allPostsData = getSortedPostsData()


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
							{ }
							<Link
								href={`/post/${categorySlug}/${id}`}
								className="text-xl text-blue-600 hover:underline"
							>
								{title}
							</Link>

							{ }
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
