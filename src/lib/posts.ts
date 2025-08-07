import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

/* ──────────────────────────────── *
 * 記事ファイルは  public/post/[日本語](slug)/xxx.md
 * ──────────────────────────────── */
const postsDirectory = path.join(process.cwd(), 'public/post')

/* ── 型定義 ───────────────────────── */
export type PostData = {
	id: string
	title: string
	date: string
	/** 表示用（日本語） */
	category: string
	/** URL 用（英数字） */
	categorySlug: string
	/** 本文 (個別ページ取得時のみ) */
	content?: string

	/* ★ 追加フィールド (すべて optional) */
	description?: string
	cover?: string
	tags?: string[]
}

export type Category = {
	/** 表示用（日本語） */
	displayName: string
	/** URL 用（英数字） */
	slug: string
}

/* ── 全記事 (フロントマターのみ) を取得・日付順ソート ── */
export function getSortedPostsData(): PostData[] {
	const dirNames = fs.readdirSync(postsDirectory)
	let allPosts: PostData[] = []

	dirNames.forEach((dirName) => {
		// フォルダ名: [日本語](slug)
		const m = dirName.match(/^\[(.+?)\]\((.+?)\)$/)
		if (!m) return
		const [, displayName, slug] = m

		const categoryDir = path.join(postsDirectory, dirName)
		if (!fs.statSync(categoryDir).isDirectory()) return

		const posts = fs
			.readdirSync(categoryDir)
			.filter((n) => n.endsWith('.md'))
			.map((fileName) => {
				const id = fileName.replace(/\.md$/, '')
				const fullPath = path.join(categoryDir, fileName)
				const { data } = matter(fs.readFileSync(fullPath, 'utf8'))

				/* data から必要フィールドだけ安全に取り出す */
				const {
					title,
					date,
					description = '',
					cover = '',
					tags = [],
				} = data as {
					title: string
					date: string
					description?: string
					cover?: string
					tags?: unknown
				}

				return {
					id,
					category: displayName,
					categorySlug: slug,
					title,
					date,
					description,
					cover,
					tags: Array.isArray(tags) ? tags.map(String) : [],
				} satisfies PostData
			})

		allPosts = allPosts.concat(posts)
	})

	/* 日付降順 (新しい順) */
	return allPosts.sort((a, b) => (a.date < b.date ? 1 : -1))
}

/* ── 個別記事 (本文込み) を取得 ── */
export async function getPostData(
	categorySlug: string,
	id: string,
): Promise<PostData> {
	/* slug から対応ディレクトリを探す */
	const dirName = fs
		.readdirSync(postsDirectory)
		.find((d) => d.match(/^\[.+?\]\((.+?)\)$/)?.[1] === categorySlug)

	if (!dirName) throw new Error(`category slug "${categorySlug}" not found`)

	const fullPath = path.join(postsDirectory, dirName, `${id}.md`)
	const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'))

	/* 日本語カテゴリ名はフォルダ名から再取得 */
	const displayName = dirName.match(/^\[(.+?)\]\(/)![1]

	const {
		title,
		date,
		description = '',
		cover = '',
		tags = [],
	} = data as {
		title: string
		date: string
		description?: string
		cover?: string
		tags?: unknown
	}

	return {
		id,
		content,
		category: displayName,
		categorySlug,
		title,
		date,
		description,
		cover,
		tags: Array.isArray(tags) ? tags.map(String) : [],
	}
}

/* ── ユーティリティ ──────────────────── */

/**
 * カテゴリスラッグから実際のディレクトリ名を取得
 */
export function getCategoryDirName(categorySlug: string): string | null {
	try {
		const dirNames = fs.readdirSync(postsDirectory)
		return (
			dirNames.find((d) => d.match(/^\[.+?\]\((.+?)\)$/)?.[1] === categorySlug) ||
			null
		)
	} catch {
		return null
	}
}

/**
 * 画像パスを解決する
 * (public/post/... にある画像を <img src> へ）
 */
export function resolveImagePath(categorySlug: string, imageName: string): string {
	return `/post/${categorySlug}/${imageName}`
}

/** public/post 配下のフォルダからカテゴリ情報を取得 */
export function getCategories(): Category[] {
	return fs
		.readdirSync(postsDirectory)
		.map((dirName) => {
			const m = dirName.match(/^\[(.+?)\]\((.+?)\)$/)
			if (!m) return null
			const [, displayName, slug] = m
			return { displayName, slug }
		})
		.filter(Boolean) as Category[]
}
