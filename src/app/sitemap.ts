// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { staticRoutes } from '@/lib/staticRoutes'
import { getSortedPostsData } from '@/lib/posts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://sae-chan.net'
// // 末尾スラッシュを削ってから結合する事で // の二重を防ぐ
// // 既定値は本番で環境変数未設定でも落ちないための保険

export default function sitemap(): MetadataRoute.Sitemap {
    // // HTMLサイトマップと同じデータソースを使って一元管理
    const posts = getSortedPostsData() as {
        id: string
        title?: string
        category: string
        categorySlug: string
        date?: string | Date
    }[]

    // // 固定ページ（トップ含む）。重複はSetで除去
    const staticPaths = Array.from(new Set<string>(['/', ...staticRoutes.map((r) => r.path)].filter(Boolean)))

    // // 絶対URL組み立て
    const toAbs = (path: string) => new URL(path, SITE_URL).toString()

    // // 固定ページのエントリ
    const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
        url: toAbs(path),
        lastModified: new Date(), // // 固定は更新日を持たない想定なのでビルド時刻
        changeFrequency: 'weekly',
        priority: path === '/' ? 1 : 0.7,
    }))

    // // 記事のエントリ（HTMLのURL規約と合わせる）
    const postEntries: MetadataRoute.Sitemap = posts.map((post) => {
        const path = `/post/${post.categorySlug}/${post.id}`
        const lastModified = post.date ? new Date(post.date) : undefined
        return {
            url: toAbs(path),
            ...(lastModified ? { lastModified } : {}), // // dateが無ければ省略
            changeFrequency: 'monthly',
            priority: 0.6,
        }
    })

    // // `/sitemap.xml` に出力される
    return [...staticEntries, ...postEntries]
}
