
import { getSortedPostsData } from '@/lib/posts'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = {
	params: Promise<{ category: string }>
}


export default async function CategoryPage({ params }: Props) {

	const categorySlug = (await params).category


	const allPosts = getSortedPostsData()


	const filtered = allPosts.filter(
		(post) => post.categorySlug === categorySlug,
	)


	if (filtered.length === 0) notFound()


	const displayName = filtered[0].category


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


export async function generateStaticParams() {
	const posts = getSortedPostsData()
	const slugs = Array.from(new Set(posts.map((p) => p.categorySlug)))
	return slugs.map((slug) => ({ category: slug }))
}
