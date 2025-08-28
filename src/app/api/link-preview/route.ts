import { NextRequest } from 'next/server'
import * as cheerio from 'cheerio'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const target = searchParams.get('url')
    if (!target) return Response.json({ error: 'Missing url' }, { status: 400 })
    try {
        const res = await fetch(target, {
            headers: {
                'user-agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari',
            },
            redirect: 'follow',
            cache: 'no-store',
        })
        if (!res.ok) return Response.json({ error: 'Fetch failed' }, { status: 502 })
        const html = await res.text()
        const $ = cheerio.load(html)
        const pick = (sel: string, attr = 'content') => ($(sel).attr(attr) || '').toString().trim()
        const ogTitle = pick('meta[property="og:title"]')
        const ogDesc = pick('meta[property="og:description"]')
        const ogImage = pick('meta[property="og:image"]')
        const ogSite = pick('meta[property="og:site_name"]')
        const title = ogTitle || $('title').text().trim() || ''
        const description = ogDesc || $('meta[name="description"]').attr('content')?.toString().trim() || ''
        let image = ogImage || ''
        try {
            if (image) image = new URL(image, target).toString()
        } catch {}
        const hostname = new URL(target).hostname
        return Response.json({
            url: target,
            title,
            description,
            image,
            siteName: ogSite || hostname,
            hostname,
        })
    } catch {
        return Response.json({ error: 'Unhandled' }, { status: 500 })
    }
}
