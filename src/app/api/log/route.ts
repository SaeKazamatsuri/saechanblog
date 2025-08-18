import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { ip, url, time } = body
        const logLine = `[${time}] IP: ${ip} URL: ${url}\n`

        const logDir = path.join(process.cwd(), 'log')
        const logFile = path.join(logDir, 'access.log')

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir)
        }

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
