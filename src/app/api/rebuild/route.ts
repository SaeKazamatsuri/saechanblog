import { NextResponse } from 'next/server'
import { exec } from 'child_process'

export async function POST() {
    // ビルドと再起動を非同期で実行
    exec('cd /home/koeda_pi/Desktop/saechanblog && npm run build && pm2 restart saechanblog')

    return NextResponse.json({ message: 'Rebuild started' })
}
