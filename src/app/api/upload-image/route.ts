import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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
        const dir = path.join(process.cwd(), 'public', 'post', dirName)
        await fs.promises.mkdir(dir, { recursive: true })

        const buffer = Buffer.from(await file.arrayBuffer())
        await fs.promises.writeFile(path.join(dir, filename), buffer)

        const url = `/post/${slug}/${filename}`
        return NextResponse.json({ ok: true, url })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'save failed' }, { status: 500 })
    }
}
