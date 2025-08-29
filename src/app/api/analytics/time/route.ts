import { NextRequest } from 'next/server'
import { loadLogs, pickRange, jstHourKey } from '@/lib/logReader'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const range = pickRange(searchParams)
    const logs = loadLogs(range)
    const byHour: Record<string, number> = {}
    for (const l of logs) {
        const k = jstHourKey(l.time)
        if (!k) continue
        byHour[k] = (byHour[k] || 0) + 1
    }
    const items = Object.entries(byHour)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour))
    return new Response(JSON.stringify({ range, items }), { headers: { 'Content-Type': 'application/json' } })
}
