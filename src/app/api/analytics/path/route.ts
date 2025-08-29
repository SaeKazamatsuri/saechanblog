import { NextRequest } from 'next/server'
import { loadLogs, pickRange, toPathname } from '@/lib/logReader'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const range = pickRange(searchParams)
    const top = Number(searchParams.get('top') || '100')
    const logs = loadLogs(range)
    const counts: Record<string, number> = {}
    for (const l of logs) {
        const p = toPathname(l.url)
        counts[p] = (counts[p] || 0) + 1
    }
    const items = Object.entries(counts)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, top)
    return new Response(JSON.stringify({ range, totalPaths: Object.keys(counts).length, items }), {
        headers: { 'Content-Type': 'application/json' },
    })
}
