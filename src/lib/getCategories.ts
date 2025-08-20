// lib/getCategories.ts
import fs from 'fs'
import path from 'path'

export type Category = {
    displayName: string
    slug: string
}

// サーバー専用カテゴリ取得
export const getCategories = (): Category[] => {
    const postsDirectory = path.join(process.cwd(), 'public/post')
    return fs
        .readdirSync(postsDirectory, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => {
            const m = dirent.name.match(/^\[(.+?)\]\((.+?)\)$/)
            if (!m) {
                return { displayName: dirent.name, slug: encodeURIComponent(dirent.name) }
            }
            const [, displayName, slug] = m
            return { displayName, slug }
        })
}
