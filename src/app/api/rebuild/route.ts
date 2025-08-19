import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

// ログ書き出し用のロガーを生成する
// 理由: 1リクエスト=1ファイルに分離し、後から追いやすくするため
function createLogger() {
    // build フォルダに出力する指定
    const logDir = path.join(process.cwd(), 'build')
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true }) // // デプロイ初回でも確実に作成するため
    }

    // JSTの日時から安全なファイル名を作る
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

    // 例: 2025-08-19_14-23-05.log
    const logFile = path.join(logDir, `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}.log`)

    // ヘッダ行を最初に1回だけ書く
    const headerTs = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} JST`
    fs.writeFileSync(logFile, `${headerTs} update start\n\n`) // // ここで新規ファイルを確定する

    // ファイルに追記する関数を返す
    const write = (block: string) => {
        // // 呼び出し側はブロック単位で渡すので、そのまま追記
        fs.appendFileSync(logFile, block.endsWith('\n') ? block : block + '\n')
    }

    return { write, logFile }
}

// JSTのタイムスタンプを1行に整形
// 理由: ログの各ブロックの先頭に揃った時刻を付けて確認しやすくするため
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

// 1ステップの実行。stdout/stderrをバッファし、終了時に「ブロック」で整形して書く
// 理由: 行単位で散在させず、まとまった塊で「見やすく」記録するため
function runStep(
    name: string,
    command: string,
    args: string[],
    cwd: string,
    write: (block: string) => void
): Promise<boolean> {
    return new Promise((resolve) => {
        const proc = spawn(command, args, { cwd, shell: true })

        let stdoutBuf = ''
        let stderrBuf = ''

        proc.stdout.on('data', (data) => {
            stdoutBuf += data.toString()
        })
        proc.stderr.on('data', (data) => {
            stderrBuf += data.toString()
        })

        proc.on('close', (code) => {
            const ok = code === 0
            const ts = formatJstTimestamp()

            // ブロック構造:
            // 2025-08-19 14:23:05 JST install:OK
            //
            //     stdout:
            //         ...
            //
            //     stderr:
            //         ...
            // 注意: タブでインデント、空行を入れて視認性を上げる
            let block = `${ts} ${name}:${ok ? 'OK' : 'NG'}\n\n`

            if (stdoutBuf.trim().length > 0) {
                block += `\tstdout:\n`
                // // 各行にタブで段下げする
                block += stdoutBuf
                    .split(/\r?\n/)
                    .filter((l) => l.length > 0)
                    .map((l) => `\t\t${l}`)
                    .join('\n')
                block += `\n\n`
            }

            if (stderrBuf.trim().length > 0) {
                block += `\tstderr${ok ? ' (non-fatal):' : ':'}\n`
                block += stderrBuf
                    .split(/\r?\n/)
                    .filter((l) => l.length > 0)
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
    // 簡易認証。注意: CookieはHTTPS/HttpOnly/SameSiteなどの対策とセットで使うこと
    const cookie = req.cookies.get('admin_auth')
    if (!cookie || cookie.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ロガー生成。以降の全ステップはこのファイルへ追記する
    const { write, logFile } = createLogger()

    // 実行する手順。注意: 絶対パスは環境に合わせて見直すこと
    const steps: [string, string, string[]][] = [
        ['pull', 'git', ['pull']],
        ['install', '/home/koeda_pi/.nvm/versions/node/v22.18.0/bin/npm', ['install', '--legacy-peer-deps']],
        ['build', '/home/koeda_pi/.nvm/versions/node/v22.18.0/bin/npm', ['run', 'build']],
        ['restart', '/home/koeda_pi/.nvm/versions/node/v22.18.0/bin/pm2', ['restart', 'saechanblog']],
    ]

    const cwd = '/home/koeda_pi/Desktop/saechanblog'
    let success = true
    for (const [name, cmd, args] of steps) {
        if (!success) break
        success = await runStep(name, cmd, args, cwd, write)
    }

    // レスポンスに今回のログファイルパスを返す。理由: 確認先を明示して手戻りを防ぐため
    return NextResponse.json({
        message: 'Update finished (see log).',
        log: path.relative(process.cwd(), logFile), // // 例: build/2025-08-19_14-23-05.log
    })
}
