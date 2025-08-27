import * as fs from 'fs'
import matter from 'gray-matter'
import {
    getSortedPostsData,
    getPostData,
    getCategoryDirName,
    resolveImagePath,
    getCategories,
    getCoverUrl,
} from './posts'

jest.mock('fs', () => ({
    readdirSync: jest.fn(),
    readFileSync: jest.fn(),
    statSync: jest.fn(),
}))

jest.mock('gray-matter', () => jest.fn())

type FrontMatter = {
    data: {
        title: string
        date: string
        description?: string
        cover?: string
        tags?: unknown
        draft?: boolean
    }
    content: string
}

const readdirSyncMock = fs.readdirSync as unknown as jest.MockedFunction<(p: fs.PathLike) => string[]>
const readFileSyncMock = fs.readFileSync as unknown as jest.MockedFunction<(p: fs.PathLike, o: 'utf8') => string>
const statSyncMock = fs.statSync as unknown as jest.MockedFunction<(p: fs.PathLike) => fs.Stats>
const matterMock = matter as unknown as jest.MockedFunction<(src: string) => FrontMatter>

const makeStats = (isDir: boolean): fs.Stats => {
    return { isDirectory: () => isDir } as unknown as fs.Stats
}

beforeEach(() => {
    jest.resetAllMocks()
})

test('getSortedPostsData: 公開記事のみ、日付降順で並ぶ', () => {
    readdirSyncMock.mockImplementation((p) => {
        const s = String(p)
        if (s.includes('public') && s.includes('post') && !s.includes('[')) {
            return ['[カテゴリ](category-slug)']
        }
        if (s.includes('[カテゴリ](category-slug)')) {
            return ['a.md', 'b.md']
        }
        return []
    })

    statSyncMock.mockImplementation(() => makeStats(true))

    readFileSyncMock.mockImplementation(() => '---\n---\n')

    const queue: FrontMatter[] = [
        { data: { title: '記事B', date: '2023-02-01', draft: false }, content: 'B' },
        { data: { title: '記事A', date: '2023-01-01', draft: false }, content: 'A' },
    ]
    matterMock.mockImplementation(() => queue.shift()!)

    const posts = getSortedPostsData()
    expect(posts.map((p) => p.title)).toEqual(['記事B', '記事A'])
    expect(posts.every((p) => p.draft === false)).toBe(true)
})

test('getSortedPostsData: draft は一覧から除外される', () => {
    readdirSyncMock.mockImplementation((p) => {
        const s = String(p)
        if (s.includes('public') && s.includes('post') && !s.includes('[')) {
            return ['[カテゴリ](category-slug)']
        }
        if (s.includes('[カテゴリ](category-slug)')) {
            return ['a.md', 'b.md']
        }
        return []
    })
    statSyncMock.mockImplementation(() => makeStats(true))
    readFileSyncMock.mockImplementation(() => '---\n---\n')

    const queue: FrontMatter[] = [
        { data: { title: '公開', date: '2024-01-01', draft: false }, content: '' },
        { data: { title: '下書き', date: '2024-01-02', draft: true }, content: '' },
    ]
    matterMock.mockImplementation(() => queue.shift()!)

    const posts = getSortedPostsData()
    expect(posts.map((p) => p.title)).toEqual(['公開'])
})

test('getPostData: 指定カテゴリとIDから記事詳細を取得する', async () => {
    readdirSyncMock.mockImplementation((p) => {
        const s = String(p)
        if (s.includes('public') && s.includes('post')) {
            return ['[カテゴリ](category-slug)']
        }
        return []
    })
    readFileSyncMock.mockImplementation(() => '---\n---\n')
    matterMock.mockImplementation(() => ({
        data: { title: '詳細記事', date: '2023-03-01', draft: false },
        content: '本文',
    }))

    const post = await getPostData('category-slug', 'a')
    expect(post.title).toBe('詳細記事')
    expect(post.content).toBe('本文')
    expect(post.category).toBe('カテゴリ')
    expect(post.categorySlug).toBe('category-slug')
})

test('getCategoryDirName: slug から元のディレクトリ名を解決できる', () => {
    readdirSyncMock.mockImplementation(() => ['[日本語カテゴリ](jp-slug)', '[英語](en)'])
    const d1 = getCategoryDirName('jp-slug')
    const d2 = getCategoryDirName('en')
    expect(d1).toBe('[日本語カテゴリ](jp-slug)')
    expect(d2).toBe('[英語](en)')
})

test('resolveImagePath: 画像の相対パスを公開パスへ変換する', () => {
    expect(resolveImagePath('cat', 'x.png')).toBe('/post/cat/x.png')
})

test('getCategories: ディレクトリ名からカテゴリ配列を生成する', () => {
    readdirSyncMock.mockImplementation(() => ['[和菓子](wagashi)', '[洋菓子](yogashi)'])
    const cs = getCategories()
    expect(cs).toEqual([
        { displayName: '和菓子', slug: 'wagashi' },
        { displayName: '洋菓子', slug: 'yogashi' },
    ])
})

test('getCoverUrl: 絶対URLと / 始まりはそのまま、相対は API パスに変換', () => {
    expect(getCoverUrl('cat', 'https://ex.com/a.png')).toBe('https://ex.com/a.png')
    expect(getCoverUrl('cat', '/static/a.png')).toBe('/static/a.png')
    expect(getCoverUrl('cat', 'a.png')).toBe('/api/images/cat/a.png')
    expect(getCoverUrl('cat', undefined)).toBeNull()
})
