import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import fsp from 'fs/promises'
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

class DailyCsvWriter {
    private currentDate: string | null = null
    private stream: fs.WriteStream | null = null
    private readonly logDir: string
    private opening: Promise<void> | null = null

    constructor(logDir: string) {
        this.logDir = logDir
    }

    private async ensureDir() {
        await fsp.mkdir(this.logDir, { recursive: true })
    }

    private async openIfNeeded(date: string) {
        if (this.currentDate === date && this.stream) return
        if (this.opening) return this.opening
        this.opening = (async () => {
            await this.ensureDir()
            if (this.stream) {
                await new Promise<void>((res) => this.stream!.end(res))
                this.stream = null
            }
            const file = path.join(this.logDir, `${date}.csv`)
            this.stream = fs.createWriteStream(file, { flags: 'a', encoding: 'utf8', mode: 0o644 })
            this.currentDate = date
            this.stream.on('error', () => {})
        })()
        await this.opening
        this.opening = null
    }

    async writeRow(row: string) {
        const date = getTodayJst()
        await this.openIfNeeded(date)
        const s = this.stream
        if (!s) throw new Error('stream not available')
        await new Promise<void>((resolve, reject) => {
            s.write(row, 'utf8', (err) => (err ? reject(err) : resolve()))
        })
    }

    async close() {
        if (!this.stream) return
        await new Promise<void>((res) => this.stream!.end(res))
        this.stream = null
    }
}

const writerSingleton = (() => {
    let inst: DailyCsvWriter | null = null
    return () => {
        if (!inst) inst = new DailyCsvWriter(resolveLogDir())
        return inst
    }
})()

function buildCsvRow(payload: Record<string, unknown>) {
    const ip = sanitize(payload.ip)
    const url = sanitize(payload.url)
    const time = sanitize(payload.time)
    const status = sanitize(payload.status)
    const redirectTo = sanitize(payload.redirectTo)
    const userAgent = sanitize(payload.userAgent)
    const method = sanitize(payload.method)
    return (
        [
            csvEscape(time),
            csvEscape(ip),
            csvEscape(url),
            csvEscape(status),
            csvEscape(redirectTo),
            csvEscape(userAgent),
            csvEscape(method),
        ].join(',') + '\n'
    )
}

export async function POST(req: NextRequest) {
    try {
        const body: unknown = await req.json()
        const b = (body ?? {}) as Record<string, unknown>
        const row = buildCsvRow(b)
        const writer = writerSingleton()
        await writer.writeRow(row)
        const devPayload =
            process.env.NODE_ENV === 'production'
                ? { success: true }
                : {
                      success: true,
                      logDir: resolveLogDir(),
                      logFile: path.join(resolveLogDir(), `${getTodayJst()}.csv`),
                      cwd: process.cwd(),
                  }

        return NextResponse.json(devPayload, { status: 200 })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        try {
            const fallback = '/tmp/saechanblog_access_error.log'
            const stamp = new Date().toISOString()
            const block = `[${stamp}] append failed\nerror: ${msg}\n\n`
            fs.appendFileSync(fallback, block, { encoding: 'utf8' })
        } catch {}
        return NextResponse.json({ success: false, error: msg }, { status: 500 })
    }
}
