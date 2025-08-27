import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    const data = await req.formData()
    const file = data.get('file') as File | null
    const dirName = data.get('dirName') as string | null
    const slug = data.get('slug') as string | null
    const filename = data.get('filename') as string | null

    if (!file || !dirName || !slug || !filename) {
        return NextResponse.json({ error: 'missing parameters' }, { status: 400 })
    }

    try {
        // ディレクトリは public/post/{dirName} 固定。パストラバーサル簡易対策としてbasenameで整形
        const safeDirName = path.basename(dirName)
        const safeFilename = path.basename(filename)
        const dir = path.join(process.cwd(), 'public', 'post', safeDirName)
        await fs.promises.mkdir(dir, { recursive: true })

        // 元ファイルをBuffer化（2回読みを避ける）
        const originalBuffer = Buffer.from(await file.arrayBuffer())

        // オリジナルを無編集で保存
        const originalPath = path.join(dir, safeFilename)
        await fs.promises.writeFile(originalPath, originalBuffer)

        // 最適化ファイル名を決定。拡張子が既に.webpなら衝突しないよう *.optimized.webp にする
        const parsed = path.parse(safeFilename)
        const extLower = parsed.ext.toLowerCase()
        const webpName = extLower === '.webp' ? `${parsed.name}.optimized.webp` : `${parsed.name}.webp`
        const webpPath = path.join(dir, webpName)

        // 最大辺1200px、縦横比維持、拡大しない、品質75のWebPで書き出し
        const webpBuffer = await sharp(originalBuffer)
            .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer()

        await fs.promises.writeFile(webpPath, webpBuffer)

        // URLは既存仕様に合わせてslugを使用（dirNameとslugが同一前提の設計に見える点は注意）
        const originalUrl = `/post/${slug}/${safeFilename}`
        const url = `/post/${slug}/${webpName}`

        return NextResponse.json({
            ok: true,
            originalUrl,
            url,
            filenameOriginal: safeFilename,
            filenameWebp: webpName,
        })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'save failed' }, { status: 500 })
    }
}
