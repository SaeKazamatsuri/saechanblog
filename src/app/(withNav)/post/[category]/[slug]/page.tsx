import React from 'react'
import { getPostData, getSortedPostsData } from '@/lib/posts'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import TableOfContents, { Heading } from '@/components/post/TableOfContents'
import Slugger from 'github-slugger'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'
import type { Root, Heading as MdHeading, PhrasingContent } from 'mdast'
import SNSsection from '@/components/toppage/SNSsection'
import MarkdownRenderer from '@/components/post/MarkdownRenderer'

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
        const relativePath = uri.startsWith('./') ? uri.slice(2) : uri
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']
        const isImage = imageExtensions.some((ext) => relativePath.toLowerCase().endsWith(ext))
        return isImage ? `/api/images/${categorySlug}/${relativePath}` : `/post/${categorySlug}/${relativePath}`
    }

    return (
        <article className="flex flex-col container mx-auto lg:flex-row gap-8 min-h-screen">
            <div className="flex-1 bg-white p-6 sm:p-10 md:p-12 mx-2 md:mx-0 rounded-xl shadow-sm">
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
                <div className="prose prose-blue pb-12 sm:prose-base lg:prose-lg max-w-none">
                    <MarkdownRenderer content={postData.content} urlTransform={urlTransform} />
                </div>
                <SNSsection title="フォローする ฅ^•ω•^ฅ♡" grayBg={false} useAnimation={false} />
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
              : 'image/ogp.jpg'
    return {
        title,
        description,
        keywords: tags,
        openGraph: {
            title,
            description,
            images: [{ url: coverUrl }],
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
