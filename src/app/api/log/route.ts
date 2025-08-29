import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

export const runtime = 'nodejs'

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
    const d = new Date()
    const ymd = d.toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 10)
    return ymd
}

async function pathExists(p: string) {
    try {
        await fs.access(p)
        return true
    } catch {
        return false
    }
}

let cachedProjectRoot: string | undefined

async function resolveProjectRoot() {
    if (cachedProjectRoot) return cachedProjectRoot
    if (process.env.PROJECT_ROOT && process.env.PROJECT_ROOT.trim() !== '') {
        cachedProjectRoot = process.env.PROJECT_ROOT
        return cachedProjectRoot
    }
    let dir = process.cwd()
    for (let i = 0; i < 10; i++) {
        if (await pathExists(path.join(dir, 'package.json'))) {
            cachedProjectRoot = dir
            return cachedProjectRoot
        }
        const parent = path.dirname(dir)
        if (parent === dir) break
        dir = parent
    }
    try {
        const thisDir = path.dirname(fileURLToPath(import.meta.url))
        dir = thisDir
        for (let i = 0; i < 10; i++) {
            if (await pathExists(path.join(dir, 'package.json'))) {
                cachedProjectRoot = dir
                return cachedProjectRoot
            }
            const parent = path.dirname(dir)
            if (parent === dir) break
            dir = parent
        }
    } catch {}
    cachedProjectRoot = process.cwd()
    return cachedProjectRoot
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

        const projectRoot = await resolveProjectRoot()
        const envLogDir =
            process.env.LOG_DIR && process.env.LOG_DIR.trim() !== '' ? process.env.LOG_DIR.trim() : undefined
        const logDir = envLogDir
            ? path.isAbsolute(envLogDir)
                ? envLogDir
                : path.join(projectRoot, envLogDir)
            : path.join(projectRoot, 'log', 'access')
        await fs.mkdir(logDir, { recursive: true })

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

        await fs.appendFile(logFile, row, { encoding: 'utf8' })

        const devPayload =
            process.env.NODE_ENV === 'production' ? { success: true } : { success: true, logDir, logFile, projectRoot }
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
