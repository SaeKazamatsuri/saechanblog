jest.mock('next/server', () => {
    class H {
        private m = new Map<string, string>()
        set(k: string, v: string) {
            this.m.set(k.toLowerCase(), v)
        }
        get(k: string) {
            return this.m.get(k.toLowerCase()) ?? null
        }
    }
    class NextResponse {
        status: number
        headers: H
        private _body: string
        constructor(body?: string, init?: { status?: number; headers?: H }) {
            this.status = init?.status ?? 200
            this.headers = init?.headers instanceof H ? init.headers : new H()
            this._body = typeof body === 'string' ? body : ''
        }
        static next() {
            return new NextResponse('', { status: 200 })
        }
        static redirect(url: string | URL) {
            const href = typeof url === 'string' ? url : url.toString()
            const h = new H()
            h.set('location', href)
            return new NextResponse('', { status: 302, headers: h })
        }
        text(): Promise<string> {
            return Promise.resolve(this._body)
        }
    }
    class NextRequest {}
    return { NextResponse, NextRequest }
})

import { middleware, config } from './middleware'
import type { NextRequest } from 'next/server'

type CookieValue = { name: string; value: string }
type MockCookies = { get: (k: string) => CookieValue | undefined }
type MockHeaders = { get: (k: string) => string | null }
type NextURLLike = URL & { clone: () => URL }
type ResLike = { status: number; headers: { get: (k: string) => string | null } }

function buildReq(path: string, init?: { ip?: string; ua?: string; method?: string; admin?: boolean }): NextRequest {
    const ip = init?.ip ?? '1.2.3.4'
    const ua = init?.ua ?? 'jest'
    const method = init?.method ?? 'GET'
    const u = new URL(`https://example.com${path}`)
    const headers = new Map<string, string>()
    headers.set('x-forwarded-for', ip)
    headers.set('user-agent', ua)
    const cookiesMap = new Map<string, string>()
    if (init?.admin) cookiesMap.set('admin_auth', 'true')
    const nextUrl = Object.assign(new URL(u.toString()), {
        clone: () => new URL(u.toString()),
    }) as NextURLLike
    const req = {
        method,
        headers: {
            get: (k: string) => headers.get(k) ?? null,
        } as MockHeaders,
        nextUrl,
        cookies: {
            get: (k: string) => {
                const v = cookiesMap.get(k)
                return v ? ({ name: k, value: v } as CookieValue) : undefined
            },
        } as MockCookies,
    }
    return req as unknown as NextRequest
}

beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-08-29T00:00:00Z'))
    ;(globalThis as unknown as { fetch: (...args: unknown[]) => Promise<unknown> }).fetch = jest
        .fn()
        .mockResolvedValue({ ok: true })
    jest.clearAllMocks()
})

afterEach(() => {
    jest.useRealTimers()
})

test('".php" へのアクセスは 403 を返す', () => {
    const res = middleware(buildReq('/index.php')) as unknown as ResLike
    expect(res.status).toBe(403)
})

test('怪しいパスへのアクセスは 403 を返す', () => {
    const res = middleware(buildReq('/node_modules/utils.js')) as unknown as ResLike
    expect(res.status).toBe(403)
})

test('レート制限: 閾値超過後は 429 を返す', () => {
    let res = middleware(buildReq('/any', { ip: '9.9.9.9' })) as unknown as ResLike
    for (let i = 0; i <= 300; i++) {
        res = middleware(buildReq('/any', { ip: '9.9.9.9' })) as unknown as ResLike
    }
    expect(res.status).toBe(429)
})

test('管理画面: 未認証ならリダイレクトされる', () => {
    const res = middleware(buildReq('/admin')) as unknown as ResLike
    const location = res.headers.get('location')
    expect(location).toBe('https://example.com/')
    expect([301, 302, 307]).toContain(res.status)
})

test('管理画面: 認証済みなら通過する', () => {
    const res = middleware(buildReq('/admin', { admin: true })) as unknown as ResLike
    expect(res.status).toBe(200)
})

test('不正なリダイレクト先 (javascript:) はホームにリダイレクト', () => {
    const res = middleware(buildReq('/redirect?to=javascript:alert(1)')) as unknown as ResLike
    const location = res.headers.get('location')
    expect(location).toBe('https://example.com/')
    expect([301, 302, 307]).toContain(res.status)
})

test('同一オリジンへのリダイレクトはホームへ誘導する', () => {
    const res = middleware(buildReq('/redirect?to=https%3A%2F%2Fexample.com%2Finside')) as unknown as ResLike
    const location = res.headers.get('location')
    expect(location).toBe('https://example.com/')
    expect([301, 302, 307]).toContain(res.status)
})

test('安全な外部リダイレクトは通過する', () => {
    const res = middleware(buildReq('/redirect?to=https%3A%2F%2Fwww.google.com%2F')) as unknown as ResLike
    expect(res.status).toBe(200)
})

test('matcher の設定が定義されている', () => {
    expect(config).toBeDefined()
    const matcher = (config as { matcher?: unknown }).matcher
    expect(Array.isArray(matcher)).toBe(true)
})
