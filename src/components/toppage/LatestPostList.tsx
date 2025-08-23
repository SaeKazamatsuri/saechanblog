// app/components/LatestPostList.tsx
import type { Post } from '../post/PostCard'
import PostCard from '../post/PostCard'
import LatestPostListAnimator from './LatestPostListAnimator'

type Props = {
    posts: Post[]
    emptyMessage?: string
    sectionId?: string
}

export default function LatestPostList({
    posts,
    emptyMessage = '投稿はまだありません',
    sectionId = 'latest-posts',
}: Props) {
    // 日付の差異に強いタイムスタンプ化
    const toTime = (p: any) => {
        const v = p?.publishedAt ?? p?.date ?? p?.createdAt ?? 0
        const t = typeof v === 'string' || typeof v === 'number' ? new Date(v).getTime() : 0
        return Number.isFinite(t) ? t : 0
    }

    // 入力の順序に依存せず常に最新5件を抽出
    const latest = [...posts].sort((a, b) => toTime(b) - toTime(a)).slice(0, 5)
    const isEmpty = latest.length === 0

    return (
        <section id={sectionId} className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3 md:py-6">
            {/* Server側は純粋にマークアップのみを担当 */}
            <h2 className="text-[clamp(20px,4vw,48px)] font-bold text-black text-center mb-8">最新の投稿</h2>

            {isEmpty ? (
                <p className="text-gray-600">{emptyMessage}</p>
            ) : (
                <ul className="space-y-10 md:space-y-12">
                    {latest.map((post, i) => (
                        // PostCardは<li>を返す想定
                        <PostCard key={`${post.categorySlug}/${post.id}`} post={post} imagePriority={i < 2} />
                    ))}
                </ul>
            )}

            {/* Client側のGSAP制御は分離して注入する */}
            <LatestPostListAnimator targetId={sectionId} itemCount={latest.length} />
        </section>
    )
}
