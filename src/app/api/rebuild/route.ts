import { NextRequest, NextResponse } from 'next/server'
import { spawn, spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// // build フォルダに日時付き .log を作る
function createLogger() {
    const logDir = path.join(process.cwd(), 'build')
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

// // JSTの一行タイムスタンプ
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

// // 1ステップ実行（終了時にブロックで追記）
function runStep(
    name: string,
    command: string,
    args: string[],
    cwd: string,
    write: (b: string) => void
): Promise<boolean> {
    return new Promise((resolve) => {
        const ts = formatJstTimestamp()

        if (path.isAbsolute(command)) {
            try {
                fs.accessSync(command, fs.constants.X_OK) // // 存在＆実行権限
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

        const proc = spawn(command, args, { cwd, shell: true })
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

// // pm2 の絶対パスを返す。見つからなければ null
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
    // // 予備: PATH から探してみる（ログ用）
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

// // pm2 restart を 1秒遅延 + デタッチで発火し、pm2 の出力を専用ログに保存する
function runRestartDetached(
    name: string,
    pm2CmdAbs: string,
    appName: string,
    cwd: string,
    write: (b: string) => void
): boolean {
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
    const buildDir = path.join(process.cwd(), 'build')
    if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true })
    const restartLog = path.join(
        buildDir,
        `pm2-restart_${parts.year}-${parts.month}-${parts.day}_${parts.hour}-${parts.minute}-${parts.second}.log`
    )
    fs.writeFileSync(
        restartLog,
        `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} JST pm2 restart start\n\n`
    )

    const cmd = `sleep 1 && "${pm2CmdAbs}" restart ${appName} >> '${restartLog}' 2>&1`
    const shellLine = `nohup bash -lc "${cmd}" >/dev/null 2>&1 &`

    try {
        spawn('bash', ['-lc', shellLine], { cwd, detached: true, stdio: 'ignore' })
        let block = `${formatJstTimestamp()} ${name}:TRIGGERED (detached)\n\n`
        block += `\tcommand:\n\t\t${shellLine}\n\n`
        block += `\tpm2 output log:\n\t\t${path.relative(process.cwd(), restartLog)}\n\n`
        block += `\t説明:\n\t\t再起動の成否は上記ログに残るよ。\n`
        write(block)
        return true
    } catch (err: any) {
        let block = `${formatJstTimestamp()} ${name}:NG\n\n`
        block += `\tspawn error:\n\t\t${err?.name || 'Error'}: ${err?.message || String(err)}\n\n`
        write(block)
        return false
    }
}

export async function POST(req: NextRequest) {
    const cookie = req.cookies.get('admin_auth')
    if (!cookie || cookie.value !== 'true') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { write, logFile } = createLogger()

    const steps: [string, string, string[]][] = [
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
        if (pm2Cmd) success = runRestartDetached('restart', pm2Cmd, 'saechanblog', cwd, write)
        else success = false
    }

    return NextResponse.json({
        message: success ? 'Update finished (restart scheduled).' : 'Update finished with errors (see log).',
        log: path.relative(process.cwd(), logFile),
    })
}
