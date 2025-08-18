// パスワードからPBKDF2(SHA-256)のハッシュを生成する
import crypto from 'node:crypto'
import readline from 'node:readline'

// 反復回数
const ITERATIONS = 310000

// パスワードを取得する関数（argv または非エコー入力）
async function getPassword(): Promise<string> {
    const arg = process.argv[2]
    if (arg) return arg
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    ;(rl as any)._writeToOutput = function (_: string) {} // 入力を非表示にする
    const pwd: string = await new Promise((resolve) => {
        ;(rl.question as any).call(rl, 'Enter password: ', {}, (answer: string) => resolve(answer)) // optionsを渡す
    })
    rl.close()
    return String(pwd || '')
}

// ハッシュを生成する関数
function hashPassword(password: string): string {
    if (!password) throw new Error('Empty password')
    const salt = crypto.randomBytes(16)
    const dkLen = 32
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, dkLen, 'sha256')
    const out = `pbkdf2$${ITERATIONS}$${salt.toString('hex')}$${hash.toString('hex')}`
    return out
}

// メイン関数
async function main() {
    try {
        const pwd = await getPassword()
        const hashed = hashPassword(pwd)
        console.log(hashed)
    } catch (err) {
        console.error((err as Error).message)
        process.exit(1)
    }
}

main()
