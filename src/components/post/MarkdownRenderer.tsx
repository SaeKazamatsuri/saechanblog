import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import { visit, SKIP } from 'unist-util-visit'
import type { Root, Paragraph, Text, Link, Image } from 'mdast'
import type { Parent, Position } from 'unist'
import type { VFile } from 'vfile'
import { LinkCard } from './LinkCard'

import type { Components } from 'react-markdown'

type WithData<T> = T & { data?: { hName?: string; hProperties?: Record<string, unknown> } }

function sliceByLineColumn(raw: string, pos?: Position | null): string {
    if (!pos) return ''
    const { start, end } = pos
    if (!start || !end) return ''
    const lines = raw.split(/\r?\n/)
    const sL = Math.max(1, start.line || 1) - 1
    const eL = Math.max(1, end.line || 1) - 1
    const sC = Math.max(1, start.column || 1) - 1
    const eC = Math.max(1, end.column || 1) - 1
    if (sL === eL) return (lines[sL] ?? '').slice(sC, eC)
    const head = (lines[sL] ?? '').slice(sC)
    const tail = (lines[eL] ?? '').slice(0, eC)
    const mid = lines.slice(sL + 1, eL).join('\n')
    return [head, mid, tail].filter(Boolean).join('\n')
}

function remarkCardifyStandaloneAutolinks() {
    return (tree: Root, file: VFile) => {
        const raw = String(file.value ?? '')
        visit(tree, 'paragraph', (node: Paragraph, index, parent: Parent | undefined) => {
            if (!parent || typeof index !== 'number') return
            const meaningful = node.children.filter((c) => {
                if (c.type === 'text') return /\S/.test((c as Text).value || '')
                return true
            })
            if (meaningful.length !== 1) return
            const only = meaningful[0]
            if (only.type !== 'link') return
            const link = only as Link
            const text =
                link.children.length === 1 && link.children[0].type === 'text'
                    ? (link.children[0] as Text).value.trim()
                    : ''
            const href = link.url.trim()
            if (text !== href) return
            const rawSlice = sliceByLineColumn(raw, link.position).trim()
            const isBracketSyntax = rawSlice.startsWith('[') && rawSlice.includes('](')
            const isAngleAutolink = rawSlice.startsWith('<') && rawSlice.endsWith('>')
            const isBareAutolink = !isBracketSyntax && !isAngleAutolink
            if (!(isAngleAutolink || isBareAutolink)) return
            const n = node as WithData<Paragraph>
            n.data = n.data ?? {}
            n.data.hName = 'link-card'
            n.data.hProperties = { href }
            ;(n as unknown as { children: [] }).children = []
            return SKIP
        })
    }
}

function remarkUnwrapStandaloneImages() {
    return (tree: Root) => {
        visit(tree, 'paragraph', (node: Paragraph, index, parent: Parent | undefined) => {
            if (!parent || typeof index !== 'number') return
            const meaningful = node.children.filter((c) => {
                if (c.type === 'text') return /\S/.test((c as Text).value || '')
                return true
            })
            const allImages =
                meaningful.length > 0 && meaningful.every((c) => c.type === 'image' || c.type === 'imageReference')
            if (allImages) {
                parent.children.splice(index, 1, ...meaningful)
                return SKIP
            }
            if (
                meaningful.length === 1 &&
                (meaningful[0].type === 'image' || meaningful[0].type === 'imageReference')
            ) {
                parent.children.splice(index, 1, meaningful[0] as Image)
                return SKIP
            }
        })
    }
}

type Props = {
    content: string | undefined
    urlTransform?: (url: string) => string
}

export default function MarkdownRenderer({ content, urlTransform }: Props) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkCardifyStandaloneAutolinks, remarkUnwrapStandaloneImages]}
            rehypePlugins={[rehypeHighlight, rehypeSlug]}
            urlTransform={urlTransform}
            components={
                {
                    h2: ({ className, ...props }) => (
                        <h2
                            {...props}
                            className={`scroll-mt-24 text-2xl sm:text-3xl font-bold mt-4 md:mt-12 mb-4 pb-2 border-b-2 border-blue-200/80 text-blue-800 ${className ?? ''}`}
                        />
                    ),
                    h3: ({ className, ...props }) => (
                        <h3
                            {...props}
                            className={`scroll-mt-24 text-xl sm:text-2xl font-semibold mt-3 md:mt-10 mb-3 text-blue-800 border-l-4 border-blue-800 pl-3 ${className ?? ''}`}
                        />
                    ),
                    p: ({ children, ...props }) => (
                        <p className="leading-relaxed text-slate-800 text-lg break-all sm:break-words my-2" {...props}>
                            {'　'}
                            {children}
                        </p>
                    ),
                    a: ({ href = '', ...props }) => (
                        <a
                            href={href}
                            target={href.startsWith('http') ? '_blank' : undefined}
                            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="underline text-blue-600 hover:text-blue-800 font-medium break-words"
                            {...props}
                        />
                    ),
                    ul: (props) => <ul className="list-disc pl-6 mt-4 space-y-2" {...props} />,
                    ol: (props) => <ol className="list-decimal pl-6 mt-4 space-y-2" {...props} />,
                    img: ({ alt, ...props }) => (
                        <img
                            alt={typeof alt === 'string' ? alt : ''}
                            className="max-h-[80vh] w-auto mx-auto my-4 rounded-lg shadow-md border border-blue-100"
                            {...props}
                        />
                    ),
                    blockquote: (props) => (
                        <blockquote
                            className="border-l-4 border-blue-400 bg-blue-50/80 p-4 my-6 italic text-slate-700"
                            {...props}
                        />
                    ),
                    pre: ({ className, ...props }) => (
                        <div className="w-full overflow-x-auto">
                            <pre
                                {...props}
                                className={`p-2 my-5 rounded-lg shadow-inner text-sm sm:text-base border-2 border-gray-200 ${className ?? ''}`}
                            />
                        </div>
                    ),
                    hr: (props) => <hr className="my-10 border-t-2 border-blue-100" {...props} />,
                    table: ({ className, ...props }) => (
                        <div className="w-full overflow-x-auto">
                            <table
                                {...props}
                                className={`w-full min-w-[640px] border-collapse border border-blue-200 my-6 ${className ?? ''}`}
                            />
                        </div>
                    ),
                    thead: (props) => <thead className="bg-blue-100 text-blue-900 font-semibold" {...props} />,
                    tbody: (props) => <tbody className="divide-y divide-blue-200" {...props} />,
                    tr: (props) => <tr className="hover:bg-blue-50" {...props} />,
                    th: (props) => <th className="border border-blue-200 px-4 py-2 text-left" {...props} />,
                    td: (props) => <td className="border border-blue-200 px-4 py-2" {...props} />,
                    'link-card': ({ href }: { href: string }) => <LinkCard href={href} />,
                } as Components
            }
        >
            {content}
        </ReactMarkdown>
    )
}
