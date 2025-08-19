import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

// // 1リクエスト=1ファイルのロガーを作る（build フォルダに日時付き .log）
function createLogger() {
    const logDir = path.join(process.cwd(), 'build') // // フォルダを build に変更
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true }) // // 初回でも失敗しないようにする
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
    fs.writeFileSync(logFile, `${headerTs} update start\n\n`) // // ヘッダー行を書いて新規ファイルを確定
    const write = (block: string) => fs.appendFileSync(logFile, block.endsWith('\n') ? block : block + '\n')
    return { write, logFile }
}

// // JSTの時刻を揃えた書式で返す（行頭のタイムスタンプを統一）
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

// // 1ステップ実行（stdout/stderr をバッファして「ブロック」で書く）
function runStep(
    name: string,
    command: string,
    args: string[],
    cwd: string,
    write: (block: string) => void
): Promise<boolean> {
    return new Promise((resolve) => {
        const ts = formatJstTimestamp()

        if (path.isAbsolute(command)) {
            const exists = fs.existsSync(command) // // 絶対パスの場合は存在チェックで即時失敗にする
            if (!exists) {
                let block = `${ts} ${name}:NG\n\n`
                block += `\tspawn error:\n`
                block += `\t\tCommand not found: ${command}\n\n`
                block += `\t対処:\n`
                block += `\t\tパスを見直すか PATH 解決のコマンド名で実行してください。\n`
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

// pm2 restart を「1秒遅延 + 非同期デタッチ」で投げ、pm2 の出力を専用ログに保存する
function runRestartDetached(
    name: string,
    pm2Cmd: string,
    appName: string,
    cwd: string,
    write: (block: string) => void
): boolean {
    // // build/pm2-restart_YYYY-MM-DD_HH-mm-ss.log に pm2 の出力を保存する
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

    const buildDir = path.join(process.cwd(), 'build') // // 念のため存在確認
    if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true })

    const restartLog = path.join(buildDir, `pm2-restart_${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}.log`)
    fs.writeFileSync(restartLog, `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} JST pm2 restart start\n\n`) // // ヘッダ

    // // 1秒遅延して pm2 を再起動。pm2 の stdout/stderr は restartLog に追記する
    const cmd = `sleep 1 && ${pm2Cmd} restart ${appName} >> '${restartLog}' 2>&1`
    const shellLine = `nohup bash -lc "${cmd}" >/dev/null 2>&1 &`

    try {
        spawn('bash', ['-lc', shellLine], { cwd, detached: true, stdio: 'ignore' }) // // 完全デタッチ
        let block = `${formatJstTimestamp()} ${name}:TRIGGERED (detached)\n\n`
        block += `\tcommand:\n`
        block += `\t\t${shellLine}\n\n`
        block += `\tpm2 output log:\n`
        block += `\t\t${path.relative(process.cwd(), restartLog)}\n\n`
        block += `\t説明:\n`
        block += `\t\t再起動の成否・pm2 側の詳細は上記ログに残るよ。\n`
        write(block)
        return true
    } catch (err: any) {
        let block = `${formatJstTimestamp()} ${name}:NG\n\n`
        block += `\tspawn error:\n`
        block += `\t\t${err?.name || 'Error'}: ${err?.message || String(err)}\n\n`
        write(block)
        return false
    }
}

export async function POST(req: NextRequest) {
    // // 簡易認証（Cookie は HTTPS/HttpOnly/SameSite を併用すること）
    const cookie = req.cookies.get('admin_auth')
    if (!cookie || cookie.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { write, logFile } = createLogger()

    const steps: [string, string, string[]][] = [
        ['pull', 'git', ['pull']], // // 既存ワーキングツリーを更新
        ['install', '/home/koeda_pi/.nvm/versions/node/v22.18.0/bin/npm', ['install', '--legacy-peer-deps']], // // 依存の解決
        ['build', '/home/koeda_pi/.nvm/versions/node/v22.18.0/bin/npm', ['run', 'build']], // // 本番ビルド
    ]

    const cwd = '/home/koeda_pi/Desktop/saechanblog'
    let success = true
    for (const [name, cmd, args] of steps) {
        if (!success) break
        success = await runStep(name, cmd, args, cwd, write)
    }

    if (success) {
        // // pm2 への再起動指示をデタッチで発火する（自分自身の再起動で親が落ちてもログは残る）
        const pm2Cmd = 'pm2' // // PATH に無いなら絶対パスに置き換えてOK（runStepの存在チェックパスはここでは使わない）
        success = runRestartDetached('restart', pm2Cmd, 'saechanblog', cwd, write)
    }

    return NextResponse.json({
        message: success ? 'Update finished (restart scheduled).' : 'Update finished with errors (see log).',
        log: path.relative(process.cwd(), logFile),
    })
}
