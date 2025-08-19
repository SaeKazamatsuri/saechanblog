import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

// ログ書き出し用のロガーを生成する
// // 1リクエスト=1ファイル。JST時刻でファイル名を付ける
function createLogger() {
    const logDir = path.join(process.cwd(), 'build')
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true }) // // 初回デプロイでも失敗しないようにする
    }

    const now = new Date()
    const parts = new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
        .formatToParts(now)
        .reduce<Record<string, string>>((acc, p) => {
            if (p.type !== 'literal') acc[p.type] = p.value
            return acc
        }, {})
    const yyyy = parts.year
    const mm = parts.month
    const dd = parts.day
    const hh = parts.hour
    const mi = parts.minute
    const ss = parts.second

    const logFile = path.join(process.cwd(), 'build', `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}.log`)
    const headerTs = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} JST`
    fs.writeFileSync(logFile, `${headerTs} update start\n\n`)
    const write = (block: string) => fs.appendFileSync(logFile, block.endsWith('\n') ? block : block + '\n')
    return { write, logFile }
}

// JSTの時刻文字列を生成
function formatJstTimestamp() {
    const now = new Date()
    const parts = new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
        .formatToParts(now)
        .reduce<Record<string, string>>((acc, p) => {
            if (p.type !== 'literal') acc[p.type] = p.value
            return acc
        }, {})
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} JST`
}

// 1ステップ実行（spawn error を含む全ての終了経路でブロックを書き出す）
function runStep(
    name: string,
    command: string,
    args: string[],
    cwd: string,
    write: (block: string) => void
): Promise<boolean> {
    return new Promise((resolve) => {
        const ts = formatJstTimestamp()

        // 絶対パスが存在しない/実行不可の早期検出
        if (path.isAbsolute(command)) {
            const exists = fs.existsSync(command)
            if (!exists) {
                let block = `${ts} ${name}:NG\n\n`
                block += `\tspawn error:\n`
                block += `\t\tCommand not found: ${command}\n\n`
                block += `\t対処:\n`
                block += `\t\tpm2 のパスを見直すか 'pm2'（PATH 解決）に変更してください。\n`
                write(block)
                return resolve(false)
            }
        }

        const proc = spawn(command, args, { cwd, shell: true })

        let stdoutBuf = ''
        let stderrBuf = ''

        proc.stdout.on('data', (data) => {
            stdoutBuf += data.toString()
        })
        proc.stderr.on('data', (data) => {
            stderrBuf += data.toString()
        })

        // 起動時点のエラー（ENOENT, EACCES など）を確実に拾う
        proc.on('error', (err) => {
            let block = `${formatJstTimestamp()} ${name}:NG\n\n`
            block += `\tspawn error:\n`
            block += `\t\t${err.name}: ${err.message}\n\n`
            block += `\tヒント:\n`
            block += `\t\tcommand: ${command}\n`
            block += `\t\targs: ${args.join(' ')}\n`
            write(block)
            resolve(false)
        })

        proc.on('close', (code) => {
            const ok = code === 0
            let block = `${formatJstTimestamp()} ${name}:${ok ? 'OK' : 'NG'}\n\n`

            if (stdoutBuf.trim().length > 0) {
                block += `\tstdout:\n`
                block += stdoutBuf
                    .split(/\r?\n/)
                    .filter(Boolean)
                    .map((l) => `\t\t${l}`)
                    .join('\n')
                block += `\n\n`
            }

            if (stderrBuf.trim().length > 0) {
                block += `\tstderr${ok ? ' (non-fatal):' : ':'}\n`
                block += stderrBuf
                    .split(/\r?\n/)
                    .filter(Boolean)
                    .map((l) => `\t\t${l}`)
                    .join('\n')
                block += `\n\n`
            }

            write(block)
            resolve(ok)
        })
    })
}

export async function POST(req: NextRequest) {
    // 簡易認証
    const cookie = req.cookies.get('admin_auth')
    if (!cookie || cookie.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { write, logFile } = createLogger()

    // 環境に合わせてここを選んでね。まずは PATH 解決の 'pm2' を推奨
    const steps: [string, string, string[]][] = [
        ['pull', 'git', ['pull']],
        ['install', '/home/koeda_pi/.nvm/versions/node/v22.18.0/bin/npm', ['install', '--legacy-peer-deps']],
        ['build', '/home/koeda_pi/.nvm/versions/node/v22.18.0/bin/npm', ['run', 'build']],
        // ['restart', '/home/koeda_pi/.nvm/versions/node/v22.18.0/bin/pm2', ['restart', 'saechanblog']], // // 絶対パスを使うならこちら（存在確認は runStep が行う）
        ['restart', 'pm2', ['restart', 'saechanblog']], // // まずは PATH 解決で試す。起動エラーはログ化される
    ]

    const cwd = '/home/koeda_pi/Desktop/saechanblog'
    let success = true
    for (const [name, cmd, args] of steps) {
        if (!success) break
        success = await runStep(name, cmd, args, cwd, write)
    }

    return NextResponse.json({
        message: 'Update finished (see log).',
        log: path.relative(process.cwd(), logFile),
    })
}
