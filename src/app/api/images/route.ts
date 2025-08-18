import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import path from 'path'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')?.trim() || ''

    const postRoot = path.join(process.cwd(), 'public', 'post')

    try {
        const entries = await readdir(postRoot, { withFileTypes: true })

        const regexp = new RegExp(`\\(${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)$`, 'i')
        const targetDir = entries.find((e) => e.isDirectory() && regexp.test(e.name))

        if (!targetDir) {
            return NextResponse.json({ images: [] })
        }

        const dirPath = path.join(postRoot, targetDir.name)
        const files = await readdir(dirPath, { withFileTypes: true })

        const images = files
            .filter((f) => f.isFile() && /\.(png|jpe?g|gif|webp|avif)$/i.test(f.name))
            .map((f) => f.name)

        return NextResponse.json({ images, folder: targetDir.name })
    } catch {
        return NextResponse.json({ images: [] })
    }
}
