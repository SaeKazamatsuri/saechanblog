import { NextRequest } from 'next/server'
import { promises as fsp } from 'fs'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function csvEscape(value: unknown) {
    const s = value === undefined || value === null ? '' : String(value)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
}

function sanitize(value: unknown) {
    const s = value === undefined || value === null ? '' : String(value)
    return s.replace(/\r?\n/g, ' ')
}

function getTodayJst() {
    const now = new Date()
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const y = jst.getUTCFullYear()
    const m = String(jst.getUTCMonth() + 1).padStart(2, '0')
    const d = String(jst.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function resolveLogDir() {
    const cwd = process.cwd()
    const raw = process.env.LOG_DIR?.trim()
    if (raw && raw.length > 0) return path.isAbsolute(raw) ? raw : path.join(cwd, raw)
    return path.join(cwd, 'log', 'access')
}

async function appendWithFallback(filePath: string, data: string) {
    try {
        await fsp.appendFile(filePath, data, { encoding: 'utf8' })
        return
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        const fallback = '/tmp/saechanblog_access_error.log'
        const stamp = new Date().toISOString()
        const block = `[${stamp}] append failed\nfile: ${filePath}\nerror: ${msg}\n\n`
        try {
            fs.appendFileSync(fallback, block, { encoding: 'utf8' })
        } catch {}
        throw e
    }
}

export async function POST(req: NextRequest) {
    try {
        const body: unknown = await req.json()
        const b = body as Record<string, unknown>

        const ip = sanitize(b.ip)
        const url = sanitize(b.url)
        const time = sanitize(b.time)
        const status = sanitize(b.status)
        const redirectTo = sanitize(b.redirectTo)
        const userAgent = sanitize(b.userAgent)
        const method = sanitize(b.method)

        const logDir = resolveLogDir()
        await fsp.mkdir(logDir, { recursive: true })

        const today = getTodayJst()
        const logFile = path.join(logDir, `${today}.csv`)

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

        await appendWithFallback(logFile, row)

        const devPayload =
            process.env.NODE_ENV === 'production'
                ? { success: true }
                : { success: true, logDir, logFile, cwd: process.cwd() }
        return new Response(JSON.stringify(devPayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e)
        return new Response(JSON.stringify({ success: false, error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
