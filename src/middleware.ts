import { NextRequest, NextResponse } from 'next/server'

const RATE_LIMIT = 300
const WINDOW_MS = 60 * 1000

const blockedPaths = [
    '.env',
    '.env.local',
    '.env.production',
    '.git',
    '.gitignore',
    '.htaccess',
    '.htpasswd',
    'wp-admin',
    'xmlrpc',
    'web.config',
    'dump.sql',
    'database.sql',
    'vendor',
    'node_modules',
    'storage',
    'logs',
    'backup',
    'tmp',
    '/.trash7309/',
    '/.well-known/about/',
    '/.well-known/acme-challenge/',
    '/.AWS_/credentials',
    '/.aws/credentials',
    '/.aws/config',
    '/.aws/s3/keys',
    '/.aws/s3/secrets',
    '/.aws/s3/tokens',
    '/.aws_lambda/config.json',
    '/.aws_lambda/secrets.json',
    '/.cloudfront/keys.json',
    '/.cloudfront/secrets.json',
    'wp-config',
    'service/email_service.py',
    'server/config/database.js',
    'scripts/nodemailer.js',
]

const IGNORE_PREFIXES = ['/image']
const IGNORE_EXTENSIONS = [
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.svg',
    '.gif',
    '.ico',
    '.bmp',
    '.avif',
    '.css',
    '.js',
    '.mjs',
    '.map',
    '.txt',
    '.xml',
    '.woff',
    '.woff2',
    '.ttf',
    '.otf',
    '.eot',
    '.mp4',
    '.webm',
    '.mp3',
    '.wav',
    '.json',
]
const IGNORE_REGEXPS: RegExp[] = []

const DEDUPE_MS = 1000
const ipAccessMap = new Map<string, { count: number; lastTime: number }>()
const dedupeMap = new Map<string, number>()

function firstIpFromHeader(v: string | null): string | undefined {
    if (!v) return undefined
    const first = v.split(',')[0]?.trim()
    return first || undefined
}

function getClientIp(req: NextRequest) {
    return (
        firstIpFromHeader(req.headers.get('x-client-ip')) ||
        firstIpFromHeader(req.headers.get('cf-connecting-ip')) ||
        firstIpFromHeader(req.headers.get('x-real-ip')) ||
        firstIpFromHeader(req.headers.get('x-forwarded-for')) ||
        'unknown'
    )
}

function isSafeExternalUrl(to: string, origin: string) {
    try {
        const u = new URL(to)
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
        const originHost = new URL(origin).host
        return u.host !== originHost
    } catch {
        return false
    }
}

function shouldIgnorePath(pathname: string) {
    for (const p of IGNORE_PREFIXES) {
        if (pathname.startsWith(p)) return true
    }
    for (const ext of IGNORE_EXTENSIONS) {
        if (pathname.toLowerCase().endsWith(ext)) return true
    }
    for (const re of IGNORE_REGEXPS) {
        if (re.test(pathname)) return true
    }
    return false
}

function makeSig(ip: string, method: string, url: string, status: number, redirectTo?: string) {
    return `${ip}|${method}|${url}|${status}|${redirectTo ?? ''}`
}

function shouldSkipByDedupe(sig: string, now: number) {
    const last = dedupeMap.get(sig)
    if (last && now - last < DEDUPE_MS) return true
    dedupeMap.set(sig, now)
    if (dedupeMap.size > 5000) {
        const cutoff = now - DEDUPE_MS
        for (const [k, v] of dedupeMap) if (v < cutoff) dedupeMap.delete(k)
    }
    return false
}

function sendAccessLog(
    origin: string,
    payload: {
        ip: string
        url: string
        time: string
        status: number
        redirectTo?: string
        userAgent: string
        method: string
    }
) {
    return fetch(`${origin}/api/log`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
    })
}

export async function middleware(req: NextRequest) {
    const now = Date.now()
    const ip = getClientIp(req)
    const url = req.nextUrl.pathname
    const origin = req.nextUrl.origin
    const userAgent = req.headers.get('user-agent') ?? ''
    const method = req.method
    const isoTime = new Date().toISOString()
    let redirectToForLog: string | undefined

    if (url.toLowerCase().endsWith('.php') || url.toLowerCase().includes('.php/')) {
        const status = 403
        const sig = makeSig(ip, method, url, status)
        if (!shouldIgnorePath(url) && !shouldSkipByDedupe(sig, now)) {
            void sendAccessLog(origin, {
                ip,
                url,
                time: isoTime,
                status,
                redirectTo: redirectToForLog,
                userAgent,
                method,
            }).catch(() => {})
        }
        return new NextResponse('Forbidden: PHP access blocked.', { status })
    }

    const lowerUrl = url.toLowerCase()
    if (blockedPaths.some((blocked) => lowerUrl.includes(blocked.toLowerCase()))) {
        const status = 403
        const sig = makeSig(ip, method, url, status)
        if (!shouldIgnorePath(url) && !shouldSkipByDedupe(sig, now)) {
            void sendAccessLog(origin, {
                ip,
                url,
                time: isoTime,
                status,
                redirectTo: redirectToForLog,
                userAgent,
                method,
            }).catch(() => {})
        }
        return new NextResponse('Forbidden: Suspicious access detected.', { status })
    }

    const record = ipAccessMap.get(ip)
    if (record) {
        if (now - record.lastTime < WINDOW_MS) {
            record.count++
            if (record.count > RATE_LIMIT) {
                const status = 429
                const sig = makeSig(ip, method, url, status)
                if (!shouldIgnorePath(url) && !shouldSkipByDedupe(sig, now)) {
                    void sendAccessLog(origin, {
                        ip,
                        url,
                        time: isoTime,
                        status,
                        redirectTo: redirectToForLog,
                        userAgent,
                        method,
                    }).catch(() => {})
                }
                return new NextResponse('Too many requests (Rate limit exceeded)', { status })
            }
        } else {
            ipAccessMap.set(ip, { count: 1, lastTime: now })
        }
    } else {
        ipAccessMap.set(ip, { count: 1, lastTime: now })
    }

    if (url.startsWith('/admin')) {
        const cookie = req.cookies.get('admin_auth')
        if (cookie?.value !== 'true') {
            const redirectUrl = req.nextUrl.clone()
            redirectUrl.pathname = '/'
            const status = 302
            const sig = makeSig(ip, method, url, status)
            if (!shouldIgnorePath(url) && !shouldSkipByDedupe(sig, now)) {
                void sendAccessLog(origin, {
                    ip,
                    url,
                    time: isoTime,
                    status,
                    redirectTo: redirectToForLog,
                    userAgent,
                    method,
                }).catch(() => {})
            }
            return NextResponse.redirect(redirectUrl)
        }
    }

    if (url === '/redirect') {
        const toParam = req.nextUrl.searchParams.get('to') || ''
        redirectToForLog = toParam
        if (!isSafeExternalUrl(toParam, origin)) {
            const home = req.nextUrl.clone()
            home.pathname = '/'
            home.search = ''
            const status = 302
            const sig = makeSig(ip, method, url, status, redirectToForLog)
            if (!shouldIgnorePath(url) && !shouldSkipByDedupe(sig, now)) {
                void sendAccessLog(origin, {
                    ip,
                    url,
                    time: isoTime,
                    status,
                    redirectTo: redirectToForLog,
                    userAgent,
                    method,
                }).catch(() => {})
            }
            return NextResponse.redirect(home)
        }
    }

    {
        const status = 200
        const sig = makeSig(ip, method, url, status, redirectToForLog)
        if (!shouldIgnorePath(url) && !shouldSkipByDedupe(sig, now)) {
            void sendAccessLog(origin, {
                ip,
                url,
                time: isoTime,
                status,
                redirectTo: redirectToForLog,
                userAgent,
                method,
            }).catch(() => {})
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/|favicon.ico|api/log).*)'],
}
