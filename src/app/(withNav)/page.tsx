// トップページ(/): 投稿一覧を表示
import { getSortedPostsData } from '@/lib/posts'
import PostList from '@/components/post/PostList'

// デフォルトのサーバーコンポーネント
export default function Page() {
    // 全投稿データ
    const posts = getSortedPostsData() // 配列: id, category, categorySlug, date, title, description?, cover?

    return (
        <div className="">
            <div className="">現在HP改修中です。コンテンツが以前の状態に戻るのは9月上旬を予定しております。</div>
            <PostList posts={posts} heading="すべての投稿" />
        </div>
    )
}
