// トップページ(/): 投稿一覧を表示
import { getSortedPostsData } from '@/lib/posts'
import PostList from '@/components/post/PostList'
import KokageHero from '@/components/toppage/KokageHero'

// デフォルトのサーバーコンポーネント
export default function Page() {
    // 全投稿データ
    const posts = getSortedPostsData() // 配列: id, category, categorySlug, date, title, description?, cover?

    return (
        <div className="">
            <KokageHero />
            <PostList posts={posts} heading="すべての投稿" />
        </div>
    )
}
