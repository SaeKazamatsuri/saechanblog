'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Category } from '@/lib/posts'
import { fmtTimestamp, getJst } from './time'
import { useToast } from '@/components/admin/ToastProvider'
import ImageCropModal from '@/components/admin/ImageCropModal'

// 機能: ディスクリプション/タグ/OGP画像
type Props = {
	description: string
	setDescription: (v: string) => void
	tags: string[]
	setTags: (v: string[]) => void
	coverUrl: string
	setCoverUrl: (v: string) => void
	categories: Category[]
	category: string
}

// 機能: URL正規化（/api/images/<category>/<filename> に統一）
const toApiImageSrc = (u: string) => {
	if (!u) return ''
	if (/^https?:\/\//i.test(u)) return u // httpはそのまま
	let p = u.replace(/^\/+/, '') // 先頭スラッシュ除去
	if (p.startsWith('api/images/')) p = p.slice('api/images/'.length) // api/images除去
	if (p.startsWith('public/post/')) p = p.slice('public/post/'.length) // public/post除去
	if (p.startsWith('post/')) p = p.slice('post/'.length) // post除去
	// 変数: 期待形は "<category>/<filename>"
	return `/api/images/${p}`
}

export default function SEOTab({
	description,
	setDescription,
	tags,
	setTags,
	coverUrl,
	setCoverUrl,
	categories,
	category,
}: Props) {
	// 変数: 入力タグ
	const [tagInput, setTagInput] = useState('')
	// 変数: 日本語入力中フラグ
	const [isComposing, setIsComposing] = useState(false)
	// 変数: 元ファイル
	const [rawFile, setRawFile] = useState<File | null>(null)
	// 変数: 加工済みファイル
	const [processedFile, setProcessedFile] = useState<File | null>(null)
	// 変数: モーダル表示
	const [showCrop, setShowCrop] = useState(false)
	// 変数: アップロード状態
	const [coverUploading, setCoverUploading] = useState(false)
	// 変数: プレビューURL
	const [previewUrl, setPreviewUrl] = useState<string>('')
	const pushToast = useToast()

	// 変数: 表示用に正規化したcoverUrl
	const resolvedCoverUrl = useMemo(() => toApiImageSrc(coverUrl), [coverUrl])

	// 機能: タグ追加
	const addTag = () => {
		const t = tagInput.trim()
		if (!t) return
		if (tags.includes(t)) {
			pushToast('同じタグが既にあるよ')
			return
		}
		setTags([...tags, t])
		setTagInput('')
	}

	// 機能: タグ削除
	const removeTag = (t: string) => {
		setTags(tags.filter(x => x !== t))
	}

	// 機能: ファイル選択
	const onPickFile = (f: File | null) => {
		if (!f) {
			setRawFile(null)
			setProcessedFile(null)
			setShowCrop(false)
			setPreviewUrl('')
			return
		}
		setRawFile(f)
		setProcessedFile(null)
		setShowCrop(true)
		setPreviewUrl('')
	}

	// 機能: プレビューURL作成と破棄
	useEffect(() => {
		if (!processedFile) {
			setPreviewUrl('')
			return
		}
		const url = URL.createObjectURL(processedFile)
		setPreviewUrl(url)
		return () => {
			URL.revokeObjectURL(url)
		}
	}, [processedFile])

	// 機能: OGP画像アップロード
	const uploadCover = async () => {
		const file = processedFile || rawFile
		if (!file) return
		const ext = '.' + (file.name.split('.').pop() || 'jpg').toLowerCase()
		const timestamp = fmtTimestamp(getJst())
		const saveName = `cover_${timestamp}${ext}`
		const display = categories.find(c => c.slug === category)?.displayName || category
		const dirName = `[${display}](${category})`

		const form = new FormData()
		form.append('file', file)
		form.append('dirName', dirName)
		form.append('slug', category)
		form.append('filename', saveName)

		setCoverUploading(true)
		const res = await fetch('/api/upload-image', { method: 'POST', body: form })
		setCoverUploading(false)
		if (!res.ok) {
			pushToast('アップロードに失敗しちゃった…')
			return
		}
		const { url } = await res.json()
		const resolved = toApiImageSrc(url) // ここで /api/images/<category>/<filename> に統一
		setCoverUrl(resolved)
		setRawFile(null)
		setProcessedFile(null)
		setPreviewUrl('')
		pushToast('OGP画像をアップロードしたよ')
	}

	return (
		<div className="space-y-6">
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

			<div>
				<label className="block mb-1 text-sm font-medium text-gray-700">
					タグ
				</label>
				<div className="flex gap-2 mb-2">
					<input
						type="text"
						value={tagInput}
						onChange={e => setTagInput(e.target.value)}
						onCompositionStart={() => setIsComposing(true)}
						onCompositionEnd={() => setIsComposing(false)}
						onKeyDown={e => {
							if (e.key === 'Enter' && !isComposing) {
								e.preventDefault()
								addTag()
							}
						}}
						placeholder="タグを入力（Enterで追加）"
						className="flex-grow px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
					/>
					<button
						onClick={addTag}
						className="px-3 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-sm"
					>
						追加
					</button>
				</div>
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
							onChange={e => onPickFile(e.target.files?.[0] || null)}
							className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
						/>
					</label>

					<button
						onClick={uploadCover}
						disabled={!(processedFile || rawFile) || coverUploading}
						className="h-[40px] bg-purple-500 hover:bg-purple-600 transition text-white px-4 py-2 rounded-sm disabled:opacity-40"
					>
						{coverUploading ? 'アップロード中…' : 'アップロード'}
					</button>

					{resolvedCoverUrl && (
						<span className="font-mono text-sm break-all">{resolvedCoverUrl.split('/').pop()}</span>
					)}
				</div>

				<div className="mt-2 space-y-2">
					{previewUrl && (
						<div>
							<p className="text-xs text-gray-600">プレビュー（未アップロード）</p>
							<img
								src={previewUrl}
								alt="OGPプレビュー（未アップロード）"
								className="block w-[240px] h-auto border border-gray-200"
							/>
						</div>
					)}
					{resolvedCoverUrl && (
						<div>
							<p className="text-xs text-gray-600">アップロード済みプレビュー</p>
							<img
								src={resolvedCoverUrl}
								alt="OGPプレビュー（アップロード済み）"
								className="block w-[240px] h-auto border border-gray-200"
							/>
						</div>
					)}
				</div>
			</div>

			{showCrop && rawFile && (
				<ImageCropModal
					file={rawFile}
					mime="image/jpeg"
					onApply={file => {
						setProcessedFile(file)
						setShowCrop(false)
					}}
					onClose={() => {
						setShowCrop(false)
						setRawFile(null)
						setProcessedFile(null)
					}}
				/>
			)}
		</div>
	)
}
