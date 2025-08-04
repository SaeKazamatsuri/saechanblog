import { getPostData, getSortedPostsData } from '@/lib/posts'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import TableOfContents, { Heading } from '@/components/post/TableOfContents'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import Slugger from 'github-slugger'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'
import type { Root, Heading as MdHeading, PhrasingContent } from 'mdast'

/* ── 型定義 ───────────────────────── */
type RouteParams = { category: string; slug: string }
/** ★ `params` は Promise で受け取る */
type Props = { params: Promise<RouteParams> }

/* ──────────────────────────────── */
export default async function Page({ params }: Props) {
	/* 1. URL パラメータ（英数字 slug） */
	const { category: categorySlug, slug } = await params   // ★ await

	/* 2. Markdown 取得 */
	const postData = await getPostData(categorySlug, slug)

	/* 3. 見出し抽出 (h2/h3) */
	const slugger = new Slugger()
	const headings: Heading[] = []

	const tree = unified().use(remarkParse).parse(postData.content) as Root
	visit(tree, 'heading', (node: MdHeading) => {
		if (node.depth !== 2 && node.depth !== 3) return
		const text = node.children
			.map((c: PhrasingContent) => ('value' in c ? String(c.value) : ''))
			.join('')
			.trim()
		if (!text) return
		const id = slugger.slug(text)
		headings.push({ id, text, level: node.depth as 2 | 3 })
	})

	/* 4. パンくず */
	const breadcrumbItems = [
		{ name: 'Home', path: '/' },
		{ name: postData.category, path: `/post/${categorySlug}` },
		{ name: postData.title },
	]

	/* 5. 相対リンク・画像パス補正 */
	const urlTransform = (uri: string) => {
		// 既に絶対URLの場合はそのまま
		if (uri.startsWith('http')) {
			return uri
		}

		// 相対パスの場合、カテゴリスラッグを使って解決
		let relativePath = uri
		if (uri.startsWith('./')) {
			relativePath = uri.slice(2)
		}

		// 画像ファイルかどうかを判定
		const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']
		const isImage = imageExtensions.some(ext => relativePath.toLowerCase().endsWith(ext))

		if (isImage) {
			// 画像の場合: API Route経由で配信
			return `/api/images/${categorySlug}/${relativePath}`
		} else {
			// その他のリンクの場合: /post/categorySlug/uri
			return `/post/${categorySlug}/${relativePath}`
		}
	}

	/* 6. 描画 */
	return (
		<article className="flex flex-col lg:flex-row gap-8 min-h-screen">
			{/* Main */}
			<div className="flex-1 bg-white p-6 sm:p-10 md:p-12 rounded-xl shadow-sm">
				<Breadcrumbs items={breadcrumbItems} />

				<div className="mt-6 mb-10 border-b border-blue-200 pb-6">
					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-900 tracking-tight">
						{postData.title}
					</h1>
					<p className="mt-3 text-base text-blue-600">{postData.date}</p>
				</div>

				<div className="prose prose-blue sm:prose-base lg:prose-lg max-w-none">
					<ReactMarkdown
						rehypePlugins={[rehypeHighlight, rehypeSlug]}
						urlTransform={urlTransform}
						components={{
							h2: ({ className, ...props }) => (
								<h2
									{...props}
									className={`scroll-mt-24 text-2xl sm:text-3xl font-bold mt-12 mb-4 pb-2 border-b-2 border-blue-200/80 text-blue-800 ${className ?? ''}`}
								/>
							),
							h3: ({ className, ...props }) => (
								<h3
									{...props}
									className={`scroll-mt-24 text-xl sm:text-2xl font-semibold mt-10 mb-3 text-blue-800 ${className ?? ''}`}
								/>
							),
							p: (props) => <p className="leading-relaxed text-slate-800 text-lg" {...props} />,
							a: ({ href = '', ...props }) => (
								<a
									href={href}
									target={href.startsWith('http') ? '_blank' : undefined}
									rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
									className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
									{...props}
								/>
							),
							ul: (props) => <ul className="list-disc pl-6 mt-4 space-y-2"      {...props} />,
							ol: (props) => <ol className="list-decimal pl-6 mt-4 space-y-2"   {...props} />,
							img: (props) => (
								<img
									className="h-auto max-h-[80vh] w-auto mx-auto rounded-lg shadow-md border border-blue-100"
									{...props}
								/>
							),
							blockquote: (props) => (
								<blockquote
									className="border-l-4 border-blue-400 bg-blue-50/80 p-4 my-6 italic text-slate-700"
									{...props}
								/>
							),
							pre: (props) => (
								<pre
									className="p-2 my-5 rounded-lg shadow-inner text-sm sm:text-base border-2 border-gray-200"
									{...props}
								/>
							),
							hr: (props) => <hr className="my-10 border-t-2 border-blue-100" {...props} />,
						}}
					>
						{postData.content}
					</ReactMarkdown>
				</div>
			</div>

			<aside className="hidden lg:block w-64 flex-shrink-0">
				<div className="sticky top-6 z-10">
					<TableOfContents headings={headings} />
				</div>
			</aside>

		</article>
	)
}

/* ── Metadata ───────────────────── */
export async function generateMetadata({ params }: Props) {
	const { category: categorySlug, slug } = await params   // ★ await
	const { title } = await getPostData(categorySlug, slug)
	return { title }
}

/* ── SSG Paths ──────────────────── */
export async function generateStaticParams() {
	const posts = getSortedPostsData()
	return posts.map(({ categorySlug, id }) => ({
		category: categorySlug,
		slug: id,
	}))
}
