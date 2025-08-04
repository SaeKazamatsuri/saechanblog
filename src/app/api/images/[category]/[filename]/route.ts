import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

type RouteParams = {
    category: string
    filename: string
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<RouteParams> }
) {
    try {
        const { category: categorySlug, filename } = await params

        // 画像ファイルかどうかをチェック
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']
        const isImage = imageExtensions.some(ext =>
            filename.toLowerCase().endsWith(ext)
        )

        if (!isImage) {
            return new NextResponse('Not an image file', { status: 400 })
        }

        // public/post フォルダから実際のディレクトリ名を探す
        const postsDirectory = path.join(process.cwd(), 'public/post')
        const dirNames = fs.readdirSync(postsDirectory)
        const dirName = dirNames.find((d) =>
            d.match(/^\[.+?\]\((.+?)\)$/)?.[1] === categorySlug
        )

        if (!dirName) {
            return new NextResponse('Category not found', { status: 404 })
        }

        const imagePath = path.join(postsDirectory, dirName, filename)

        // ファイルが存在するかチェック
        if (!fs.existsSync(imagePath)) {
            return new NextResponse('Image not found', { status: 404 })
        }

        // 画像ファイルの内容を読み込み
        const imageBuffer = fs.readFileSync(imagePath)

        // Content-Typeを設定
        const extension = path.extname(filename).toLowerCase()
        const contentType = getContentType(extension)

        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable', // 1年キャッシュ
            },
        })
    } catch (error) {
        console.error('Error serving image:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

function getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
    }
    return contentTypes[extension] || 'application/octet-stream'
}