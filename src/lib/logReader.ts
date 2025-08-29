import fs from 'fs'
import path from 'path'

export type LogEntry = {
    time: string
    ip: string
    url: string
    status: string
    redirectTo: string
    userAgent: string
    method: string
}

const LOG_DIR = path.join(process.cwd(), 'log', 'access')

function parseCSV(content: string): string[][] {
    const rows: string[][] = []
    let row: string[] = []
    let field = ''
    let inQuotes = false
    for (let i = 0; i < content.length; i++) {
        const c = content[i]
        if (inQuotes) {
            if (c === '"') {
                if (content[i + 1] === '"') {
                    field += '"'
                    i++
                } else {
                    inQuotes = false
                }
            } else {
                field += c
            }
        } else {
            if (c === '"') {
                inQuotes = true
            } else if (c === ',') {
                row.push(field)
                field = ''
            } else if (c === '\n') {
                row.push(field)
                rows.push(row)
                row = []
                field = ''
            } else if (c === '\r') {
            } else {
                field += c
            }
        }
    }
    if (field.length > 0 || row.length > 0) {
        row.push(field)
        rows.push(row)
    }
    return rows
}

function listFilesInRange(from?: string, to?: string, date?: string): string[] {
    if (!fs.existsSync(LOG_DIR)) return []
    const names = fs.readdirSync(LOG_DIR).filter((n) => n.endsWith('.csv'))
    if (date) {
        const target = `${date}.csv`
        return names.includes(target) ? [target] : []
    }
    if (!from && !to) {
        const today = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 10)
        const target = `${today}.csv`
        return names.includes(target) ? [target] : []
    }
    const f = from ?? '0000-01-01'
    const t = to ?? '9999-12-31'
    return names
        .filter((n) => {
            const ymd = n.replace('.csv', '')
            return ymd >= f && ymd <= t
        })
        .sort()
}

export function loadLogs(params: { date?: string; from?: string; to?: string }): LogEntry[] {
    const files = listFilesInRange(params.from, params.to, params.date)
    const all: LogEntry[] = []
    for (const name of files) {
        const p = path.join(LOG_DIR, name)
        if (!fs.existsSync(p)) continue
        const content = fs.readFileSync(p, 'utf-8')
        const rows = parseCSV(content)
        for (const r of rows) {
            const [time, ip, url, status, redirectTo, userAgent, method] = [
                r[0] ?? '',
                r[1] ?? '',
                r[2] ?? '',
                r[3] ?? '',
                r[4] ?? '',
                r[5] ?? '',
                r[6] ?? '',
            ]
            all.push({ time, ip, url, status, redirectTo, userAgent, method })
        }
    }
    return all
}

export function toPathname(u: string): string {
    try {
        const parsed = new URL(u)
        return parsed.pathname || '/'
    } catch {
        const q = u.indexOf('?')
        return (q >= 0 ? u.slice(0, q) : u) || '/'
    }
}

export function jstHourKey(isoLike: string): string | null {
    const d = new Date(isoLike)
    if (isNaN(d.getTime())) return null
    const s = d.toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo', hour12: false })
    return s.slice(0, 13)
}

export function pickRange(params: URLSearchParams) {
    const date = params.get('date') || undefined
    const from = params.get('from') || undefined
    const to = params.get('to') || undefined
    return { date, from, to }
}
