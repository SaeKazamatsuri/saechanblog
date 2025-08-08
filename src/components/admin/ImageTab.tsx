'use client'

import { useState } from 'react'
import type { Category } from '@/lib/posts'
import { fmtTimestamp, getJst } from './time'
import ImageGalleryModal from '@/components/admin/ImageGalleryModal'
import { useToast } from '@/components/admin/ToastProvider'

// 機能: 本文用画像アップロード/コピー
type Props = {
	categories: Category[]
	category: string
}

export default function ImageTab({ categories, category }: Props) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [uploadedUrl, setUploadedUrl] = useState('')
	const [uploading, setUploading] = useState(false)
	const pushToast = useToast()

	// 機能: 画像アップロード
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
			pushToast('アップロードに失敗しちゃった…')
			return
		}
		const { url } = await res.json()
		setUploadedUrl(url)
		setSelectedFile(null)
		pushToast('画像をアップロードしたよ')
	}

	// 機能: マークダウン埋め込みコピー
	const copyMarkdown = () => {
		if (!uploadedUrl) return
		const file = uploadedUrl.split('/').pop()!
		navigator.clipboard.writeText(`![image](/${file})`)
		pushToast('コピーしました')
	}

	return (
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
						<span className="font-mono text-sm break-all">{uploadedUrl.split('/').pop()}</span>
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
	)
}
