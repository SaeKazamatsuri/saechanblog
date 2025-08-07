'use client'

import dynamic from 'next/dynamic'
import { useRef, useState, useEffect } from 'react'
import matter from 'gray-matter'
import type { Category } from '@/lib/posts'
import ImageGalleryModal from '@/components/admin/ImageGalleryModal';
import { useToast } from '@/components/admin/ToastProvider'; // ★ 追加

/* ------------ Toast UI Editor (動的 import) ------------ */
const ToastEditor = dynamic(
	() => import('@toast-ui/react-editor').then(m => m.Editor),
	{ ssr: false },
)

/* ---------- 型が解決できない場合のお守り ---------- */
type HTMLToken = {
	type: 'openTag' | 'closeTag'
	tagName: string
	selfClose?: boolean
	attributes?: Record<string, string>
}
type HTMLConvertorContext = {
	entering: boolean
	skipChildren: () => void
	getChildrenText: (node: unknown) => string
}
type HTMLConvertor = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	node: any,
	context: HTMLConvertorContext,
) => HTMLToken | HTMLToken[]
interface HTMLConvertorMap {
	[key: string]: HTMLConvertor | undefined
}
/* ----------------------------------------------------- */

/* ---------- util: レンダラーを作る関数 ---------- */
const makeRenderer = (slug: string): HTMLConvertorMap => {
	const isHttp = (u: string) => /^https?:\/\//i.test(u)
	const stripHead = (u: string) => u.replace(/^\.?\//, '')

	const resolveImg = (u: string) =>
		isHttp(u) ? u : `/api/images/${slug}/${stripHead(u)}`
	const resolveHref = (u: string) =>
		isHttp(u) ? u : `/post/${slug}/${stripHead(u)}`

	return {
		image(node: any, { skipChildren, getChildrenText }) {
			skipChildren()
			return {
				type: 'openTag',
				tagName: 'img',
				selfClose: true,
				attributes: {
					src: resolveImg(node.destination),
					alt: getChildrenText(node) ?? '',
				},
			}
		},
		link(node: any, { entering }) {
			const token: HTMLToken = {
				type: entering ? 'openTag' : 'closeTag',
				tagName: 'a',
			}
			if (entering) {
				token.attributes = {
					href: resolveHref(node.destination),
					target: '_blank',
					rel: 'noopener noreferrer',
				}
			}
			return token
		},
	}
}

/* ---------- JST (UTC+9) の日付 / 時刻文字列 ---------- */
const getJst = () => {
	const JST_OFFSET_MIN = -9 * 60 // -540
	const diff = (JST_OFFSET_MIN - new Date().getTimezoneOffset()) * 6e4
	return new Date(Date.now() + diff)
}
const pad = (n: number) => String(n).padStart(2, '0')
/** 例: 2025-08-04 */
const fmtDate = (d: Date) =>
	`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
/** 例: 20250804231207 */
const fmtTimestamp = (d: Date) =>
	`${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
	`${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */
export default function AdminPage() {
	/* refs & state ---------------------------------------------------------- */
	const editorRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any

	const [categories, setCategories] = useState<Category[]>([])
	const [category, setCategory] = useState('')

	// ▶ 投稿タイトル・日付
	const [title, setTitle] = useState('')
	const [date, setDate] = useState(fmtDate(getJst()))

	// ▶ SEO: description / tags / cover
	const [description, setDescription] = useState('')
	const [tagInput, setTagInput] = useState('')
	const [tags, setTags] = useState<string[]>([])
	const [coverFile, setCoverFile] = useState<File | null>(null)
	const [coverUploading, setCoverUploading] = useState(false)
	const [coverUrl, setCoverUrl] = useState('') // アップロード後の画像 URL

	// ▶ 投稿ファイル名
	const [filename, setFilename] = useState('')

	// ▶ 通常の画像アップロード (本文用)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [uploadedUrl, setUploadedUrl] = useState('')
	const [uploading, setUploading] = useState(false)

	const pushToast = useToast();

	// 表示タブ
	type Tab = 'post' | 'title' | 'image' | 'seo'
	const [tab, setTab] = useState<Tab>('post')

	/* effect: カテゴリ一覧取得 ---------------------------------------------- */
	useEffect(() => {
		; (async () => {
			const res = await fetch('/api/categories')
			const data = (await res.json()) as Category[]
			setCategories(data)
			if (data.length) setCategory(data[0].slug)
		})()
	}, [])

	/* handlers -------------------------------------------------------------- */
	/** 記事保存 */
	const savePost = async (overwrite = false) => {
		const md = editorRef.current?.getInstance()?.getMarkdown()
		if (!md || !filename || !title || !date) {
			alert('タイトル・日付・ファイル名・本文を確認してね')
			setTab('post')
			return
		}

		// front-matter を合成
		const fmLines: string[] = [
			'---',
			`title: '${title.replace(/'/g, "''")}'`,
			`date: '${date}'`,
			`description: '${description.replace(/'/g, "''")}'`,
			`cover: '${coverUrl.split('/').pop()!}'`,
			`tags: [${tags.map(t => `'${t}'`).join(', ')}]`,
			'---',
		]
		const frontMatterStr = fmLines.join('\n')
		const content = `${frontMatterStr}\n\n${md}`

		const res = await fetch('/api/save-post', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content, category, filename, overwrite }),
		})

		if (res.status === 409) {
			if (confirm('同名ファイルがあります。上書きする？')) {
				await savePost(true)
			} else {
				alert('保存をキャンセルしたよ')
			}
			return
		}
		res.ok ? alert('保存したよ') : alert('保存失敗しちゃった…')
	}

	/** 本文用画像アップロード */
	const uploadImage = async () => {
		if (!selectedFile) return

		const ext = '.' + (selectedFile.name.split('.').pop() || 'png').toLowerCase()
		const timestamp = fmtTimestamp(getJst())
		const saveName = `${timestamp}${ext}`

		const display =
			categories.find(c => c.slug === category)?.displayName || category
		const dirName = `[${display}](${category})`

		const form = new FormData()
		form.append('file', selectedFile)
		form.append('dirName', dirName)
		form.append('slug', category)
		form.append('filename', saveName)

		setUploading(true)
		const res = await fetch('/api/upload-image', { method: 'POST', body: form })
		setUploading(false)
		if (!res.ok) {
			alert('アップロード失敗しちゃった…')
			return
		}
		const { url } = await res.json() // /post/slug/yyyymmddhhmmss.png
		setUploadedUrl(url)
		setSelectedFile(null)
	}

	/** cover 画像アップロード (SEOタブ) */
	const uploadCover = async () => {
		if (!coverFile) return

		const ext = '.' + (coverFile.name.split('.').pop() || 'png').toLowerCase()
		const timestamp = fmtTimestamp(getJst())
		const saveName = `cover_${timestamp}${ext}`

		const display =
			categories.find(c => c.slug === category)?.displayName || category
		const dirName = `[${display}](${category})`

		const form = new FormData()
		form.append('file', coverFile)
		form.append('dirName', dirName)
		form.append('slug', category)
		form.append('filename', saveName)

		setCoverUploading(true)
		const res = await fetch('/api/upload-image', { method: 'POST', body: form })
		setCoverUploading(false)
		if (!res.ok) {
			alert('アップロード失敗しちゃった…')
			return
		}
		const { url } = await res.json()
		setCoverUrl(url) // front-matter 用パス
		setCoverFile(null)
	}

	/** Markdown をコピー */
	const copyMarkdown = () => {
		if (!uploadedUrl) return
		const file = uploadedUrl.split('/').pop()!
		navigator.clipboard.writeText(`![image](/${file})`)
		pushToast('コピーしました');
	}

	/** タグ追加 */
	const addTag = () => {
		const t = tagInput.trim()
		if (!t) return
		if (tags.includes(t)) {
			alert('同じタグが既にあるよ')
			return
		}
		setTags([...tags, t])
		setTagInput('')
	}

	/** タグ削除 */
	const removeTag = (t: string) => setTags(tags.filter(x => x !== t))

	/* render --------------------------------------------------------------- */
	if (!category) {
		// カテゴリ取得待ち
		return <p className="p-6">Loading…</p>
	}

	return (
		<section className="p-6 space-y-6">
			<div className="flex flex-col lg:flex-row gap-6">
				{/* 入力エリア（左） */}
				<div className="w-full lg:w-1/2 p-6 bg-gray-50 rounded-sm border border-gray-200">
					{/* ---------- タブ ---------- */}
					<div className="flex border-b border-gray-300 mb-4">
						{(
							[
								{ id: 'post', label: '投稿' },
								{ id: 'title', label: 'タイトル' },
								{ id: 'image', label: '画像' },
								{ id: 'seo', label: 'SEO' }, // ★ 追加
							] as { id: Tab; label: string }[]
						).map(t => (
							<button
								key={t.id}
								onClick={() => setTab(t.id)}
								className={`px-4 py-2 -mb-px border-b-2 text-sm
									${tab === t.id
										? 'border-blue-600 text-blue-600 font-semibold'
										: 'border-transparent text-gray-600 hover:text-blue-600'
									}`}
							>
								{t.label}
							</button>
						))}
					</div>

					{/* ---------- タブ内容 ---------- */}
					{/* 投稿タブ */}
					{tab === 'post' && (
						<div className="space-y-4">
							<div className="flex flex-wrap items-center gap-4">
								<select
									value={category}
									onChange={e => setCategory(e.target.value)}
									className="h-[40px] px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
								>
									{categories.map(c => (
										<option key={c.slug} value={c.slug}>
											{c.displayName}
										</option>
									))}
								</select>

								<input
									type="text"
									value={filename}
									onChange={e => setFilename(e.target.value)}
									placeholder="ファイル名"
									className="h-[40px] flex-grow px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
								/>

								<button
									onClick={() => savePost(false)}
									className="h-[40px] bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-sm"
								>
									保存
								</button>
							</div>
						</div>
					)}

					{/* タイトルタブ */}
					{tab === 'title' && (
						<div className="space-y-4">
							<div className="flex flex-wrap items-center gap-4">
								<input
									type="text"
									value={title}
									onChange={e => setTitle(e.target.value)}
									placeholder="タイトル"
									className="h-[40px] flex-grow px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
								/>
								<input
									type="date"
									value={date}
									onChange={e => setDate(e.target.value)}
									className="h-[40px] px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
								/>
							</div>
						</div>
					)}

					{/* 画像タブ (本文用) */}
					{tab === 'image' && (
						<div className="space-y-4">
							<div className="flex flex-wrap items-center gap-4">
								<label className="relative inline-block">
									<span className="inline-block px-3 py-2 bg-gray-100 border border-gray-300 rounded-sm cursor-pointer hover:bg-gray-200">
										画像を選択
									</span>
									<input
										type="file"
										accept="image/*"
										onChange={e => setSelectedFile(e.target.files?.[0] || null)}
										className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
									/>
								</label>

								<button
									onClick={uploadImage}
									disabled={!selectedFile || uploading}
									className="h-[40px] bg-purple-500 hover:bg-purple-600 transition text-white px-4 py-2 rounded-sm disabled:opacity-40"
								>
									{uploading ? 'アップロード中…' : 'アップロード'}
								</button>

								{uploadedUrl && (
									<div className="h-[40px] flex items-center gap-2 bg-gray-50 border border-gray-300 px-3 py-2 rounded-sm">
										<span className="font-mono text-sm break-all">
											{uploadedUrl}
										</span>
										<button
											onClick={copyMarkdown}
											className="bg-green-600 hover:bg-green-700 transition text-white text-sm px-2 py-1 rounded"
										>
											コピー
										</button>
									</div>
								)}

								<div className="">
									<ImageGalleryModal category={category} />
								</div>
							</div>
						</div>
					)}

					{/* SEOタブ */}
					{tab === 'seo' && (
						<div className="space-y-6">
							{/* description */}
							<div>
								<label className="block mb-1 text-sm font-medium text-gray-700">
									ディスクリプション
								</label>
								<textarea
									value={description}
									onChange={e => setDescription(e.target.value)}
									rows={3}
									placeholder="記事の説明文を入力"
									className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
								/>
							</div>

							{/* tags */}
							<div>
								<label className="block mb-1 text-sm font-medium text-gray-700">
									タグ
								</label>

								{/* 入力行 */}
								<div className="flex gap-2 mb-2">
									<input
										type="text"
										value={tagInput}
										onChange={e => setTagInput(e.target.value)}
										placeholder="タグを入力"
										className="flex-grow px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
									/>
									<button
										onClick={addTag}
										className="px-3 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-sm"
									>
										追加
									</button>
								</div>

								{/* タグ一覧 */}
								{tags.length > 0 && (
									<ul className="flex flex-wrap gap-2">
										{tags.map(t => (
											<li
												key={t}
												className="flex items-center bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-sm"
											>
												<span>{t}</span>
												<button
													onClick={() => removeTag(t)}
													className="ml-1 text-blue-700 hover:text-blue-900"
												>
													×
												</button>
											</li>
										))}
									</ul>
								)}
							</div>

							{/* cover 画像 */}
							<div>
								<label className="block mb-1 text-sm font-medium text-gray-700">
									OGP 画像
								</label>
								<div className="flex flex-wrap items-center gap-4">
									<label className="relative inline-block">
										<span className="inline-block px-3 py-2 bg-gray-100 border border-gray-300 rounded-sm cursor-pointer hover:bg-gray-200">
											画像を選択
										</span>
										<input
											type="file"
											accept="image/*"
											onChange={e => setCoverFile(e.target.files?.[0] || null)}
											className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
										/>
									</label>

									<button
										onClick={uploadCover}
										disabled={!coverFile || coverUploading}
										className="h-[40px] bg-purple-500 hover:bg-purple-600 transition text-white px-4 py-2 rounded-sm disabled:opacity-40"
									>
										{coverUploading ? 'アップロード中…' : 'アップロード'}
									</button>

									{coverUrl && (
										<span className="font-mono text-sm break-all">
											{coverUrl}
										</span>
									)}
								</div>
							</div>
						</div>
					)}
				</div>

				{/* プレビューエリア（右） */}
				<div className="w-full lg:w-1/2 mt-4 lg:mt-0 ">
					<div className="border-b border-blue-200 pb-6 pt-3">
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-900 tracking-tight">
							{title || 'タイトル未入力'}
						</h1>
					</div>

					<p className="mt-3 text-base text-blue-600">{date || '日付未入力'}</p>

					{/* タグプレビュー */}
					{tags.length > 0 && (
						<ul className="mt-2 flex flex-wrap gap-2">
							{tags.map(t => (
								<li
									key={t}
									className="text-xs sm:text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md"
								>
									{t}
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			{/* ---------- Editor ---------- */}
			<ToastEditor
				ref={editorRef}
				key={category}
				initialValue="## はじめましょう"
				previewStyle="vertical"
				height="70vh"
				initialEditType="markdown"
				hideModeSwitch={false}
				usageStatistics={false}
				customHTMLRenderer={makeRenderer(category)}
			/>
		</section>
	)
}
