// /post: / と同一の一覧表示
import { getSortedPostsData } from '@/lib/posts'
import PostList from '@/components/post/PostList'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'すべての投稿',
    description: 'ショートランドのこかげ(sae-chan.net)のすべての投稿',
}

// デフォルトのサーバーコンポーネント
export default function Page() {
    // 全投稿データ
    const posts = getSortedPostsData() // 配列: id, category, categorySlug, date, title, description?, cover?

    return <PostList posts={posts} heading="すべての投稿" />
}
