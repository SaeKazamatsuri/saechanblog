// 投稿一覧のラッパー
import { Post } from './PostCard'
import PostCard from './PostCard'

// プロパティ
type Props = {
	posts: Post[] // 表示する投稿配列
	heading?: string // 見出し
	emptyMessage?: string // 0件時のメッセージ
}

// 一覧の見出しとカード群を表示
export default function PostList({
	posts,
	heading = 'すべての投稿',
	emptyMessage = '投稿はまだありません',
}: Props) {
	const isEmpty = posts.length === 0 // 0件かどうか

	return (
		<section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 md:py-12">
			<h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6">{heading}</h1>

			{isEmpty ? (
				<p className="text-gray-600">{emptyMessage}</p>
			) : (
				<ul className="space-y-10 md:space-y-12">
					{posts.map((post, i) => (
						<PostCard
							key={`${post.categorySlug}/${post.id}`}
							post={post}
							imagePriority={i < 2}
						/>
					))}
				</ul>
			)}
		</section>
	)
}
