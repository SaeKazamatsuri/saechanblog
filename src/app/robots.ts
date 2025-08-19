// src/app/robots.ts
import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://sae-chan.net'

// robots.txt を生成する。/kazamatsuri と /admin をクローリング対象から外す
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/', // サイト全体は許可
            disallow: ['/kazamatsuri', '/admin'], // ここだけ拒否
        },
        sitemap: [`${SITE_URL}/sitemap.xml`],
    }
}
