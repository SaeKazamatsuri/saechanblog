import { NextRequest, NextResponse } from 'next/server'

const ipAccessMap = new Map<string, { count: number; lastTime: number }>()

const RATE_LIMIT = 100
const WINDOW_MS = 60 * 1000

const blockedPaths = [
    // 環境・設定ファイル
    '.env',
    '.env.local',
    '.env.production',
    '.git',
    '.gitignore',
    '.htaccess',
    '.htpasswd',

    // CMS / 管理ディレクトリ
    'wp-admin',
    'xmlrpc',

    // データベースやバックアップ
    'web.config',
    'dump.sql',
    'database.sql',

    // ディレクトリ
    'vendor',
    'node_modules',
    'storage',
    'logs',
    'backup',
    'tmp',

    // 隠しディレクトリ利用
    '/.trash7309/',
    '/.well-known/about/',
    '/.well-known/acme-challenge/',

    // クラウド認証情報
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

    // ソースコードや設定漏洩
    'wp-config',
    'service/email_service.py',
    'server/config/database.js',
    'scripts/nodemailer.js',
]

export function middleware(req: NextRequest) {
    const now = Date.now()
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const url = req.nextUrl.pathname

    // .php を完全拒否（にいさまのサイトでは不要だから即403）
    if (url.toLowerCase().endsWith('.php') || url.toLowerCase().includes('.php/')) {
        return new NextResponse('Forbidden: PHP access blocked.', { status: 403 })
    }

    // 既知の不正アクセスパターンをブロック
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
