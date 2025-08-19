import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { ip, url, time, status } = body
        const logLine = `[${time}] IP: ${ip} URL: ${url} STATUS: ${status}\n`

        // log/access ディレクトリを作成
        const logDir = path.join(process.cwd(), 'log', 'access')
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true })
        }

        // 日付ごとのファイルに分ける
        const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
        const logFile = path.join(logDir, `${today}.log`)

        fs.appendFileSync(logFile, logLine)

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (err) {
        console.error('ログ書き込みエラー:', err)
        return new Response(JSON.stringify({ success: false }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
