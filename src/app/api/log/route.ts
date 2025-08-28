import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

function csvEscape(value: unknown) {
    const s = value === undefined || value === null ? '' : String(value)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
}

function getTodayJst() {
    const d = new Date()
    const ymd = d.toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 10)
    return ymd
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { ip, url, time, status, redirectTo, userAgent, method } = body

        const logDir = path.join(process.cwd(), 'log', 'access')
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })

        const today = getTodayJst()
        const logFile = path.join(logDir, `${today}.csv`)

        if (!fs.existsSync(logFile)) {
            const header = ['time', 'ip', 'url', 'status', 'redirectTo', 'userAgent', 'method'].join(',') + '\n'
            fs.writeFileSync(logFile, header)
        }

        const row =
            [
                csvEscape(time),
                csvEscape(ip),
                csvEscape(url),
                csvEscape(status),
                csvEscape(redirectTo),
                csvEscape(userAgent),
                csvEscape(method),
            ].join(',') + '\n'

        fs.appendFileSync(logFile, row)

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch {
        return new Response(JSON.stringify({ success: false }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
