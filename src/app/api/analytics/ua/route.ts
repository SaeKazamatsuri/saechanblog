import { NextRequest } from 'next/server'
import { loadLogs, pickRange } from '@/lib/logReader'

export const runtime = 'nodejs'

function detect(os: Record<string, number>, br: Record<string, number>, dv: Record<string, number>, ua: string) {
    const s = ua || ''
    let b = 'Other'
    if (/Edg\//i.test(s)) b = 'Edge'
    else if (/Chrome\//i.test(s) && !/Chromium/i.test(s)) b = 'Chrome'
    else if (/Firefox\//i.test(s)) b = 'Firefox'
    else if (/Safari\//i.test(s) && !/Chrome\//i.test(s)) b = 'Safari'
    else if (/Chromium/i.test(s)) b = 'Chromium'
    br[b] = (br[b] || 0) + 1
    let o = 'Other'
    if (/Windows NT/i.test(s)) o = 'Windows'
    else if (/Android/i.test(s)) o = 'Android'
    else if (/iPhone|iPad|iPod/i.test(s)) o = 'iOS'
    else if (/Mac OS X|Macintosh/i.test(s)) o = 'macOS'
    else if (/Linux/i.test(s)) o = 'Linux'
    os[o] = (os[o] || 0) + 1
    const d = /Mobile|Android|iPhone|iPad|iPod/i.test(s) ? 'Mobile' : 'Desktop'
    dv[d] = (dv[d] || 0) + 1
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const range = pickRange(searchParams)
    const logs = loadLogs(range)
    const byBrowser: Record<string, number> = {}
    const byOS: Record<string, number> = {}
    const byDevice: Record<string, number> = {}
    for (const l of logs) detect(byOS, byBrowser, byDevice, l.userAgent)
    const topUA: Record<string, number> = {}
    for (const l of logs) topUA[l.userAgent] = (topUA[l.userAgent] || 0) + 1
    const topUserAgents = Object.entries(topUA)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([ua, count]) => ({ ua, count }))
    return new Response(
        JSON.stringify({
            range,
            byBrowser: Object.entries(byBrowser)
                .map(([browser, count]) => ({ browser, count }))
                .sort((a, b) => b.count - a.count),
            byOS: Object.entries(byOS)
                .map(([os, count]) => ({ os, count }))
                .sort((a, b) => b.count - a.count),
            byDevice: Object.entries(byDevice)
                .map(([device, count]) => ({ device, count }))
                .sort((a, b) => b.count - a.count),
            topUserAgents,
        }),
        { headers: { 'Content-Type': 'application/json' } }
    )
}
