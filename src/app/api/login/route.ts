// runtime: Node.jsで実行する設定
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'

// 管理者ハッシュ。形式は "pbkdf2$iterations$saltHex$hashHex"
const ADMIN_HASH = process.env.ADMIN_HASH || ''

// PBKDF2でパスワードを検証する関数
function verifyPassword(password: string, stored: string): boolean {
    const parts = stored.split('$')
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
    const iterations = parseInt(parts[1], 10)
    if (!Number.isFinite(iterations) || iterations <= 0) return false
    const salt = Buffer.from(parts[2], 'hex')
    const expected = Buffer.from(parts[3], 'hex')
    const derived = crypto.pbkdf2Sync(password, salt, iterations, expected.length, 'sha256')
    if (derived.length !== expected.length) return false
    return crypto.timingSafeEqual(derived, expected)
}

// リクエストボディからpasswordを読む関数
async function readPassword(req: NextRequest): Promise<string | null> {
    try {
        const json = await req.json()
        const pwd = typeof json?.password === 'string' ? json.password : ''
        return pwd || null
    } catch {
        return null
    }
}

// POST /api/login
export async function POST(req: NextRequest) {
    //console.log(ADMIN_HASH)

    if (!ADMIN_HASH) {
        return NextResponse.json({ error: 'Server misconfigured: ADMIN_HASH missing' }, { status: 500 })
    }

    const password = await readPassword(req)
    if (!password) {
        return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    const ok = verifyPassword(password, ADMIN_HASH)
    if (!ok) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // admin_authクッキーを発行（4時間有効）
    const res = NextResponse.json({ ok: true })
    res.cookies.set({
        name: 'admin_auth', // ミドルウェアが参照するクッキー名
        value: 'true', // ミドルウェアの要件に合わせる
        httpOnly: true, // JSから参照不可
        sameSite: 'lax', // CSRF軽減
        secure: true, // HTTPSのみ
        path: '/', // 全パスで有効
        maxAge: 60 * 60 * 4, // 4時間
    })
    return res
}
