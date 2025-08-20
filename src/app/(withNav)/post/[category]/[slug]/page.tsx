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
import remarkGfm from 'remark-gfm'

type RouteParams = { category: string; slug: string }
type Props = { params: Promise<RouteParams> }

export default async function Page({ params }: Props) {
    const { category: categorySlug, slug } = await params

    const postData = await getPostData(categorySlug, slug)

    const tags: string[] = Array.isArray(postData.tags) ? postData.tags : []

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

    const breadcrumbItems = [
        { name: 'ホーム', path: '/' },
        { name: postData.category, path: `/post/${categorySlug}` },
        { name: postData.title },
    ]

    const urlTransform = (uri: string) => {
        if (uri.startsWith('http')) return uri

        let relativePath = uri.startsWith('./') ? uri.slice(2) : uri
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']
        const isImage = imageExtensions.some((ext) => relativePath.toLowerCase().endsWith(ext))

        return isImage ? `/api/images/${categorySlug}/${relativePath}` : `/post/${categorySlug}/${relativePath}`
    }

    return (
        <article className="flex flex-col container mx-auto lg:flex-row gap-8 min-h-screen">
            <div className="flex-1 bg-white p-6 sm:p-10 md:p-12 rounded-xl shadow-sm">
                <Breadcrumbs items={breadcrumbItems} />

                <div className="mt-6 mb-10 border-b border-blue-200 pb-6">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-900 tracking-tight">
                        {postData.title}
                    </h1>

                    <p className="mt-3 text-base text-blue-600">{postData.date}</p>

                    {tags.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <li
                                    key={tag}
                                    className="text-xs sm:text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md"
                                >
                                    {tag}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="prose prose-blue sm:prose-base lg:prose-lg max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
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
                            ul: (props) => <ul className="list-disc pl-6 mt-4 space-y-2" {...props} />,
                            ol: (props) => <ol className="list-decimal pl-6 mt-4 space-y-2" {...props} />,
                            img: (props) => (
                                <img
                                    className="h-auto max-h-[80vh] w-auto mx-auto my-5 rounded-lg shadow-md border border-blue-100"
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

                            table: (props) => (
                                <table className="w-full border-collapse border border-blue-200 my-6" {...props} />
                            ),
                            thead: (props) => <thead className="bg-blue-100 text-blue-900 font-semibold" {...props} />,
                            tbody: (props) => <tbody className="divide-y divide-blue-200" {...props} />,
                            tr: (props) => <tr className="hover:bg-blue-50" {...props} />,
                            th: (props) => <th className="border border-blue-200 px-4 py-2 text-left" {...props} />,
                            td: (props) => <td className="border border-blue-200 px-4 py-2" {...props} />,
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

export async function generateMetadata({ params }: Props) {
    const { category: categorySlug, slug } = await params
    const { title, description, cover, tags } = await getPostData(categorySlug, slug)

    const coverUrl =
        cover && cover.startsWith('http')
            ? cover
            : cover
              ? `/api/images/${categorySlug}/${cover.replace(/^\.?\//, '')}`
              : undefined

    return {
        title,
        description,
        keywords: tags,
        openGraph: {
            title,
            description,
            images: coverUrl ? [{ url: coverUrl }] : undefined,
        },
    }
}

export async function generateStaticParams() {
    const posts = getSortedPostsData()
    return posts.map(({ categorySlug, id }) => ({
        category: categorySlug,
        slug: id,
    }))
}
