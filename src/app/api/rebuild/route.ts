import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

// ログ出力関数
function writeLog(message: string) {
    const logDir = path.join(process.cwd(), 'log')
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir)
    }
    const logFile = path.join(logDir, 'build.log')
    const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }).replace(/\//g, '-') // 日付を YYYY-MM-DD 形式っぽく
    fs.appendFileSync(logFile, `${timestamp} ${message}\n`)
}

// spawnを使ってコマンドを実行する関数
function runStep(name: string, command: string, args: string[], cwd: string): Promise<boolean> {
    return new Promise((resolve) => {
        const proc = spawn(command, args, { cwd, shell: true })

        let stderrData = ''
        proc.stdout.on('data', (data) => {
            writeLog(`${name}: ${data.toString().trim()}`)
        })
        proc.stderr.on('data', (data) => {
            stderrData += data.toString()
        })

        proc.on('close', (code) => {
            if (code !== 0) {
                writeLog(`${name}: NG \n{${stderrData.trim()}}`)
                return resolve(false)
            }
            if (stderrData) {
                writeLog(`${name}: OK (with stderr: ${stderrData.trim()})`)
            } else {
                writeLog(`${name}: OK`)
            }
            resolve(true)
        })
    })
}

export async function POST(req: NextRequest) {
    // 認証
    const cookie = req.cookies.get('admin_auth')
    if (!cookie || cookie.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 実行する手順
    const steps: [string, string, string[]][] = [
        ['pull', 'git', ['pull']],
        ['install', 'npm', ['install', '--legacy-peer-deps']],
        ['build', 'npm', ['run', 'build']],
        ['restart', 'pm2', ['restart', 'saechanblog']],
    ]

    const cwd = '/home/koeda_pi/Desktop/saechanblog'
    let success = true
    for (const [name, cmd, args] of steps) {
        if (!success) break
        success = await runStep(name, cmd, args, cwd)
    }

    return NextResponse.json({ message: 'Update started. Check log/build.log for details.' })
}
