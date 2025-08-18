import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'

// ログ出力関数
function writeLog(message: string) {
    const logDir = path.join(process.cwd(), 'log')
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir)
    }
    const logFile = path.join(logDir, 'build.log')
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '')
    fs.appendFileSync(logFile, `${timestamp} ${message}\n`)
}

// コマンドを実行してログを残すPromise関数
function runStep(name: string, cmd: string): Promise<boolean> {
    return new Promise((resolve) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                writeLog(`${name}: NG \n{${error.message}}`)
                return resolve(false)
            }
            if (stderr) {
                // stderrに出力があってもエラー扱いしない（必要ならNGにしてもよい）
                writeLog(`${name}: OK (with stderr: ${stderr.trim()})`)
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
    const steps: [string, string][] = [
        ['pull', 'git pull'],
        ['install', 'npm install --legacy-peer-deps'],
        ['build', 'npm run build'],
        ['restart', 'pm2 restart saechanblog'],
    ]

    // ルートディレクトリに移動して順次処理
    const cwd = '/home/koeda_pi/Desktop/saechanblog'
    let success = true
    for (const [name, cmd] of steps) {
        if (!success) break // 途中でNGなら残りは実行しない
        success = await runStep(name, cmd.startsWith('cd') ? cmd : `cd ${cwd} && ${cmd}`)
    }

    return NextResponse.json({ message: 'Update started. Check log/build.log for details.' })
}
