import { NextRequest } from 'next/server'
import { loadLogs, pickRange } from '@/lib/logReader'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const range = pickRange(searchParams)
    const logs = loadLogs(range)
    const byStatus: Record<string, number> = {}
    for (const l of logs) byStatus[l.status] = (byStatus[l.status] || 0) + 1
    const items = Object.entries(byStatus)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count)
    return new Response(JSON.stringify({ range, items }), { headers: { 'Content-Type': 'application/json' } })
}
