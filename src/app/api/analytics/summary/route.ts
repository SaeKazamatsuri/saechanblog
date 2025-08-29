import { NextRequest } from 'next/server'
import { loadLogs, pickRange, toPathname } from '@/lib/logReader'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const range = pickRange(searchParams)
    const logs = loadLogs(range)
    const total = logs.length
    const byStatus: Record<string, number> = {}
    const byMethod: Record<string, number> = {}
    const pathCount: Record<string, number> = {}
    const uniqueIps = new Set<string>()
    for (const l of logs) {
        byStatus[l.status] = (byStatus[l.status] || 0) + 1
        byMethod[l.method] = (byMethod[l.method] || 0) + 1
        const p = toPathname(l.url)
        pathCount[p] = (pathCount[p] || 0) + 1
        if (l.ip) uniqueIps.add(l.ip)
    }
    const topPaths = Object.entries(pathCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([path, count]) => ({ path, count }))
    return new Response(
        JSON.stringify({
            range,
            total,
            uniqueIps: uniqueIps.size,
            byStatus,
            byMethod,
            topPaths,
        }),
        { headers: { 'Content-Type': 'application/json' } }
    )
}
