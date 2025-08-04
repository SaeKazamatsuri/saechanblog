'use client'

import { useState, useMemo, ChangeEvent } from 'react'
import matter from 'gray-matter'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'

// 型定義
interface FrontMatter {
	title?: string
	date?: string
	[key: string]: any
}

export default function EnhancedMarkdownEditor() {
	const [markdown, setMarkdown] = useState<string>(`---
title: 'タイトル'
date: '20yy-mm-dd'
---`)
	const [blockText, setBlockText] = useState<string>('')

	const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) =>
		setMarkdown(e.target.value)

	const handleBlockTextChange = (e: ChangeEvent<HTMLInputElement>) =>
		setBlockText(e.target.value)

	const addBlock = (blockType: string) => {
		if (!blockText.trim()) return

		let formattedText = ''
		switch (blockType) {
			case 'h2':
				formattedText = `## ${blockText}`
				break
			case 'h3':
				formattedText = `### ${blockText}`
				break
			case 'p':
				formattedText = blockText
				break
			case 'ul':
				formattedText = `- ${blockText}`
				break
			case 'ol':
				formattedText = `1. ${blockText}`
				break
			case 'blockquote':
				formattedText = `> ${blockText.replace(/\n/g, '\n> ')}`
				break
			case 'code':
				formattedText = `\`${blockText}\``
				break
			default:
				formattedText = blockText
		}

		setMarkdown(prev => prev + '\n\n' + formattedText)
		setBlockText('')
	}

	// Markdownパース
	const { data: meta, content: body } = useMemo(
		() => matter(markdown),
		[markdown]
	)

	const frontMatter = meta as FrontMatter

	// Markdownコンポーネント
	const mdComponents = {
		h2: ({ className, ...props }: any) => (
			<h2
				{...props}
				className={`scroll-mt-24 text-2xl sm:text-3xl font-bold mt-12 mb-4 pb-2 border-b-2 border-blue-200/80 text-blue-800 ${className ?? ''}`}
			/>
		),
		h3: ({ className, ...props }: any) => (
			<h3
				{...props}
				className={`scroll-mt-24 text-xl sm:text-2xl font-semibold mt-10 mb-3 text-blue-800 ${className ?? ''}`}
			/>
		),
		p: (props: any) => (
			<p className="leading-relaxed text-slate-800 text-lg mb-4" {...props} />
		),
		a: ({ href = '', ...props }: any) => (
			<a
				href={href}
				target={href.startsWith('http') ? '_blank' : undefined}
				rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
				className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
				{...props}
			/>
		),
		ul: (props: any) => <ul className="list-disc pl-6 mt-4 mb-4 space-y-2" {...props} />,
		ol: (props: any) => <ol className="list-decimal pl-6 mt-4 mb-4 space-y-2" {...props} />,
		li: (props: any) => <li className="text-slate-800" {...props} />,
		img: (props: any) => (
			<img
				className="h-auto max-h-[80vh] w-auto mx-auto rounded-lg shadow-md border border-blue-100 my-6"
				{...props}
			/>
		),
		blockquote: (props: any) => (
			<blockquote
				className="border-l-4 border-blue-400 bg-blue-50/80 p-4 my-6 mb-4 italic text-slate-700 rounded-r-lg"
				{...props}
			/>
		),
		pre: (props: any) => (
			<pre
				className="p-4 my-6 rounded-lg shadow-inner text-sm sm:text-base border-2 border-gray-200 overflow-x-auto"
				{...props}
			/>
		),
		hr: (props: any) => <hr className="my-10 border-t-2 border-blue-100" {...props} />,
		code: ({ className, ...props }: any) => (
			<code
				className={`${className ? '' : 'px-1.5 py-0.5 bg-gray-100 text-red-600 rounded text-sm font-mono'
					} ${className ?? ''}`}
				{...props}
			/>
		),
	}

	return (
		<div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50/30">
			{/* 左: エディタ */}
			<section className="w-1/2 border-r border-blue-200/60 p-6">
				<div className="h-full flex flex-col">
					<h2 className="text-2xl font-bold mb-4 text-blue-900">
						Markdown Editor
					</h2>

					{/* ブロック追加エリア */}
					<div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
						<h3 className="text-sm font-semibold text-gray-700 mb-2">ブロック追加</h3>
						<div className="flex gap-2 mb-2">
							<input
								type="text"
								value={blockText}
								onChange={handleBlockTextChange}
								placeholder="追加するテキストを入力..."
								className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
							/>
						</div>
						<div className="flex flex-wrap gap-1">
							<button
								onClick={() => addBlock('h2')}
								className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
							>
								H2
							</button>
							<button
								onClick={() => addBlock('h3')}
								className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
							>
								H3
							</button>
							<button
								onClick={() => addBlock('p')}
								className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition-colors"
							>
								P
							</button>
							<button
								onClick={() => addBlock('ul')}
								className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded transition-colors"
							>
								UL
							</button>
							<button
								onClick={() => addBlock('ol')}
								className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded transition-colors"
							>
								OL
							</button>
							<button
								onClick={() => addBlock('blockquote')}
								className="px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded transition-colors"
							>
								Quote
							</button>
							<button
								onClick={() => addBlock('code')}
								className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
							>
								Code
							</button>
						</div>
					</div>

					<textarea
						value={markdown}
						onChange={handleChange}
						spellCheck={false}
						className="flex-1 resize-none p-4 font-mono text-sm leading-6 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
						placeholder="ここにMarkdownを入力してください..."
					/>
				</div>
			</section>

			{/* 右: プレビュー */}
			<section className="w-1/2 p-6 overflow-y-auto">
				<h2 className="text-2xl font-bold mb-4 text-blue-900">
					プレビュー
				</h2>

				<div className="max-w-4xl mx-auto">
					{/* フロントマター + Markdown本文をまとめる */}
					<div className="bg-white p-8 rounded-xl shadow-sm border border-blue-100">
						{/* フロントマター表示 */}
						{(frontMatter.title || frontMatter.date) && (
							<div className="mt-6 mb-10 border-b border-blue-200 pb-6">
								{frontMatter.title && (
									<h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-900 tracking-tight">
										{frontMatter.title}
									</h1>
								)}
								{frontMatter.date && (
									<p className="mt-3 text-base text-blue-600">
										{frontMatter.date}
									</p>
								)}
							</div>
						)}

						{/* Markdown本文 */}
						<article className="prose prose-blue sm:prose-base lg:prose-lg max-w-none">
							<style>
								{`
									blockquote > p {
										margin-bottom: 0 !important;
									}
								`}
							</style>
							<ReactMarkdown
								rehypePlugins={[rehypeHighlight, rehypeSlug]}
								components={mdComponents}
							>
								{body}
							</ReactMarkdown>
						</article>
					</div>
				</div>
			</section>

		</div>
	)
}