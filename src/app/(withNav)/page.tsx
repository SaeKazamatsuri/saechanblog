// トップページ(/): 投稿一覧を表示
import { getSortedPostsData } from '@/lib/posts'
import KokageHero from '@/components/toppage/KokageHero'
import WhatShortland from '@/components/toppage/WhatShortland'
import SNSsection from '@/components/toppage/SNSsection'
import LatestPostList from '@/components/toppage/LatestPostList'

// デフォルトのサーバーコンポーネント
export default function Page() {
    // 全投稿データ
    const posts = getSortedPostsData() // 配列: id, category, categorySlug, date, title, description?, cover?

    return (
        <div className="">
            <KokageHero />
            <WhatShortland />
            <LatestPostList posts={posts} />
            <SNSsection />
        </div>
    )
}
