// app/api/update/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { spawn, spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// ビルド用ログファイルを JST の日時で作成し、追記関数を返す
function createLogger() {
    const logDir = path.join(process.cwd(), 'log/build')
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })

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
        .reduce<Record<string, string>>((a, p) => {
            if (p.type !== 'literal') a[p.type] = p.value
            return a
        }, {})
    const logFile = path.join(
        logDir,
        `${parts.year}-${parts.month}-${parts.day}_${parts.hour}-${parts.minute}-${parts.second}.log`
    )
    fs.writeFileSync(
        logFile,
        `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} JST update start\n\n`
    )
    const write = (block: string) => fs.appendFileSync(logFile, block.endsWith('\n') ? block : block + '\n')
    return { write, logFile }
}

// JST の一行タイムスタンプを返す
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
        .reduce<Record<string, string>>((a, p) => {
            if (p.type !== 'literal') a[p.type] = p.value
            return a
        }, {})
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} JST`
}

// 1 ステップ実行を同期的に待つ。envExtra で PATH や色設定を上書きできる
async function runStep(
    name: string,
    command: string,
    args: string[],
    cwd: string,
    write: (b: string) => void,
    envExtra?: NodeJS.ProcessEnv
): Promise<boolean> {
    return new Promise((resolve) => {
        const ts = formatJstTimestamp()

        if (path.isAbsolute(command)) {
            try {
                fs.accessSync(command, fs.constants.X_OK) // 実行可能か事前検証することで失敗時の原因を明確化
            } catch {
                let block = `${ts} ${name}:NG\n\n`
                block += `\tspawn error:\n`
                block += `\t\tCommand not found or not executable: ${command}\n\n`
                block += `\t対処:\n`
                block += `\t\tパスを見直すか PATH 解決のコマンド名で実行してください。\n`
                write(block)
                return resolve(false)
            }
        }

        const mergedEnv = { ...process.env, ...envExtra }
        const proc = spawn(command, args, { cwd, shell: true, env: mergedEnv })
        let stdoutBuf = ''
        let stderrBuf = ''

        proc.stdout.on('data', (d) => {
            stdoutBuf += d.toString()
        })
        proc.stderr.on('data', (d) => {
            stderrBuf += d.toString()
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
            if (stdoutBuf.trim()) {
                block += `\tstdout:\n`
                block += stdoutBuf
                    .split(/\r?\n/)
                    .filter(Boolean)
                    .map((l) => `\t\t${l}`)
                    .join('\n')
                block += `\n\n`
            }
            if (stderrBuf.trim()) {
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

// pm2 の絶対パスを返す。見つからなければ null を返し、ログに状況を残す
function resolvePm2Absolute(write: (b: string) => void): string | null {
    const candidates = [
        '/home/koeda_pi/.nvm/versions/node/v22.18.0/bin/pm2',
        '/home/koeda_pi/.nvm/versions/node/current/bin/pm2',
        '/usr/local/bin/pm2',
        '/usr/bin/pm2',
    ]
    for (const p of candidates) {
        try {
            fs.accessSync(p, fs.constants.X_OK)
            const ts = formatJstTimestamp()
            write(`${ts} restart:PM2_PATH\n\n\tpath:\n\t\t${p}\n\n`)
            return p
        } catch {}
    }
    try {
        const r = spawnSync('bash', ['-lc', 'command -v pm2 || true'], { encoding: 'utf8' })
        const found = r.stdout.trim()
        if (found) {
            const ts = formatJstTimestamp()
            write(`${ts} restart:PM2_PATH\n\n\tpath:\n\t\t${found}\n\n`)
            return found
        }
    } catch {}
    const ts = formatJstTimestamp()
    write(
        `${ts} restart:NG\n\n\tspawn error:\n\t\tpm2 binary not found in common locations or PATH\n\n\t対処:\n\t\tpm2 をグローバルにインストールするか、pm2 の絶対パスを resolvePm2Absolute() の candidates に追加してください。\n\n`
    )
    return null
}

// pm2 実行用の環境を構築する。nvm の node bin を PATH 先頭に置き、色コードを無効化する
function buildEnvForPm2(pm2CmdAbs: string): NodeJS.ProcessEnv {
    const nodeBinDir = path.dirname(pm2CmdAbs)
    const base = process.env || {}
    return {
        ...base,
        PATH: `${nodeBinDir}:${base.PATH || ''}`,
        NO_COLOR: '1',
        FORCE_COLOR: '0',
    }
}

// pm2 の再起動を同期的に実行し、出力をすべて logFile に残す
async function runRestart(
    name: string,
    pm2CmdAbs: string,
    appName: string,
    cwd: string,
    write: (block: string) => void,
    env?: NodeJS.ProcessEnv
): Promise<boolean> {
    const nodeBinDir = path.dirname(pm2CmdAbs)
    const nodeAbs = path.join(nodeBinDir, 'node')
    try {
        fs.accessSync(nodeAbs, fs.constants.X_OK)
    } catch {
        let block = `${formatJstTimestamp()} ${name}:NG\n\n`
        block += `\tspawn error:\n`
        block += `\t\tNode binary not found or not executable: ${nodeAbs}\n\n`
        block += `\t対処:\n`
        block += `\t\tnvm の Node を確認し、pm2 と同じバージョンの bin を使ってください。\n`
        write(block)
        return false
    }

    const mergedEnv = { ...buildEnvForPm2(pm2CmdAbs), ...env }

    const okRestart = await runStep(
        `${name}-restart`,
        pm2CmdAbs,
        ['restart', appName, '--update-env'],
        cwd,
        write,
        mergedEnv
    )
    if (!okRestart) return false

    const okLs = await runStep(`${name}-ls`, pm2CmdAbs, ['ls'], cwd, write, mergedEnv)
    return okRestart && okLs
}

async function runUpdateProcess(write: (block: string) => void, logFile: string) {
    const steps: [string, string, string[]][] = [
        ['reset', 'git', ['reset', '--hard']],
        ['pull', 'git', ['pull']],
        ['install', '/home/koeda_pi/.nvm/versions/node/v22.18.0/bin/npm', ['install', '--legacy-peer-deps']],
        ['build', '/home/koeda_pi/.nvm/versions/node/v22.18.0/bin/npm', ['run', 'build']],
    ]

    const cwd = '/home/koeda_pi/Desktop/saechanblog'

    let success = true
    for (const [name, cmd, args] of steps) {
        if (!success) break
        success = await runStep(name, cmd, args, cwd, write)
    }

    if (success) {
        const pm2Cmd = resolvePm2Absolute(write)
        if (pm2Cmd) success = await runRestart('restart', pm2Cmd, 'saechanblog', cwd, write)
        else success = false
    }

    fs.appendFileSync(logFile, `\n処理終了: ${success ? 'OK' : 'NG'}\n`)
}

export async function POST(req: NextRequest) {
    const cookie = req.cookies.get('admin_auth')
    if (!cookie || cookie.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { write, logFile } = createLogger()

    // バックグラウンドで処理を実行
    runUpdateProcess(write, logFile).catch((err) => {
        write(`\nバックグラウンド処理エラー: ${err.message}\n`)
    })

    // 即レスポンスを返す
    return NextResponse.json({
        message: 'Update process started. (処理はバックグラウンドで進行中)',
        log: path.relative(process.cwd(), logFile),
    })
}
