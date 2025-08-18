import { NextRequest, NextResponse } from 'next/server'

const ipAccessMap = new Map<string, { count: number; lastTime: number }>()

const RATE_LIMIT = 100
const WINDOW_MS = 60 * 1000

const blockedPaths = [
    '.env',
    '.env.local',
    '.env.production',
    '.git',
    '.gitignore',
    '.htaccess',
    '.htpasswd',

    'wp-login.php',
    'wp-admin',
    'xmlrpc.php',

    'phpmyadmin',
    'adminer.php',

    'config.php',
    'configuration.php',
    'web.config',

    'config.php.bak',
    'config.php.old',
    'dump.sql',
    'database.sql',

    'vendor',
    'node_modules',
    'storage',
    'logs',
    'backup',
    'tmp',
]

export function middleware(req: NextRequest) {
    const now = Date.now()
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const url = req.nextUrl.pathname

    if (blockedPaths.some((blocked) => url.includes(blocked))) {
        return new NextResponse('Forbidden: Suspicious access detected.', { status: 403 })
    }

    const record = ipAccessMap.get(ip)
    if (record) {
        if (now - record.lastTime < WINDOW_MS) {
            record.count++
            if (record.count > RATE_LIMIT) {
                return new NextResponse('Too many requests (Rate limit exceeded)', { status: 429 })
            }
        } else {
            ipAccessMap.set(ip, { count: 1, lastTime: now })
        }
    } else {
        ipAccessMap.set(ip, { count: 1, lastTime: now })
    }

    const isoTime = new Date().toISOString()
    fetch(`${req.nextUrl.origin}/api/log`, {
        method: 'POST',
        body: JSON.stringify({ ip, url, time: isoTime }),
        headers: { 'Content-Type': 'application/json' },
    }).catch(() => {})

    if (url.startsWith('/admin')) {
        const cookie = req.cookies.get('admin_auth')
        if (cookie?.value !== 'true') {
            const redirectUrl = req.nextUrl.clone()
            redirectUrl.pathname = '/'
            return NextResponse.redirect(redirectUrl)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next|favicon.ico|api/log).*)'],
}
