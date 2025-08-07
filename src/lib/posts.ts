import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

/* ──────────────────────────────── *
 * 記事ファイルは  public/post/[日本語](slug)/xxx.md
 * ──────────────────────────────── */
const postsDirectory = path.join(process.cwd(), 'public/post')


export type PostData = {
	id: string
	title: string
	date: string

	category: string

	categorySlug: string

	content?: string


	description?: string
	cover?: string
	tags?: string[]
}

export type Category = {

	displayName: string

	slug: string
}


export function getSortedPostsData(): PostData[] {
	const dirNames = fs.readdirSync(postsDirectory)
	let allPosts: PostData[] = []

	dirNames.forEach((dirName) => {

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


	return allPosts.sort((a, b) => (a.date < b.date ? 1 : -1))
}


export async function getPostData(
	categorySlug: string,
	id: string,
): Promise<PostData> {

	const dirName = fs
		.readdirSync(postsDirectory)
		.find((d) => d.match(/^\[.+?\]\((.+?)\)$/)?.[1] === categorySlug)

	if (!dirName) throw new Error(`category slug "${categorySlug}" not found`)

	const fullPath = path.join(postsDirectory, dirName, `${id}.md`)
	const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'))


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
