'use client'

import { useEffect, useMemo, useState } from 'react'
import Cropper, { Area } from 'react-easy-crop'

type Props = {
	file: File // 画像ソース
	onApply: (croppedFile: File) => void // 決定時コールバック
	onClose: () => void // 閉じるコールバック
	mime?: 'image/jpeg' | 'image/png' // 出力MIME
	filename?: string // 出力ファイル名
}

// 機能: 画像読み込み
const readAsDataURL = (file: File) =>
	new Promise<string>((resolve, reject) => {
		const r = new FileReader()
		r.onload = () => resolve(String(r.result))
		r.onerror = reject
		r.readAsDataURL(file)
	})

// 機能: 画像要素生成
const createHTMLImage = (src: string) =>
	new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve(img)
		img.onerror = reject
		img.src = src
	})

// 機能: キャンバスに指定領域を1200x630に描画
const cropToFixedCanvas = async (
	imageSrc: string,
	cropPx: Area, // ピクセル領域
	outW = 1200,
	outH = 630,
	mime: 'image/jpeg' | 'image/png' = 'image/jpeg',
	quality = 0.9
): Promise<Blob> => {
	const img = await createHTMLImage(imageSrc)
	const canvas = document.createElement('canvas')
	canvas.width = outW
	canvas.height = outH
	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('Canvas not supported')

	// 変数: ソース領域
	const sx = Math.max(0, cropPx.x)
	const sy = Math.max(0, cropPx.y)
	const sw = Math.min(img.width - sx, cropPx.width)
	const sh = Math.min(img.height - sy, cropPx.height)

	// 機能: 目的サイズへリサイズ描画
	ctx.imageSmoothingQuality = 'high'
	ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)

	// 機能: Blob化
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			b => (b ? resolve(b) : reject(new Error('toBlob failed'))),
			mime,
			mime === 'image/jpeg' ? quality : undefined
		)
	})
}

export default function ImageCropModal({
	file,
	onApply,
	onClose,
	mime = 'image/jpeg',
	filename,
}: Props) {
	// 変数: DataURL
	const [dataUrl, setDataUrl] = useState<string>('')
	// 変数: クロップ状態
	const [crop, setCrop] = useState({ x: 0, y: 0 })
	// 変数: ズーム
	const [zoom, setZoom] = useState(1)
	// 変数: 決定用ピクセル領域
	const [croppedAreaPx, setCroppedAreaPx] = useState<Area | null>(null)
	// 変数: 決定ボタン状態
	const [working, setWorking] = useState(false)

	useEffect(() => {
		let revoked = false
			; (async () => {
				const url = await readAsDataURL(file)
				if (!revoked) setDataUrl(url)
			})()
		return () => {
			revoked = true
		}
	}, [file])

	// 変数: 出力ファイル名
	const outName = useMemo(() => {
		if (filename) return filename
		const base = file.name.replace(/\.(jpeg|jpg|png|webp|gif|tiff)$/i, '')
		return `${base}_ogp_1200x630.${mime === 'image/png' ? 'png' : 'jpg'}`
	}, [file.name, filename, mime])

	// 機能: クロップ確定
	const handleApply = async () => {
		if (!dataUrl || !croppedAreaPx) return
		setWorking(true)
		try {
			const blob = await cropToFixedCanvas(dataUrl, croppedAreaPx, 1200, 630, mime, 0.9)
			const cropped = new File([blob], outName, { type: blob.type })
			onApply(cropped)
		} catch (e) {
			console.error(e) // エラー表示
			onClose()
		} finally {
			setWorking(false)
		}
	}

	return (
		<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60">
			<div className="bg-white w-full max-w-3xl rounded-sm shadow-lg">
				<div className="flex items-center justify-between border-b px-4 py-2">
					<h2 className="text-sm font-medium">OGP画像をクロップ（1200×630）</h2>
					<button onClick={onClose} className="text-gray-600 hover:text-black">閉じる</button>
				</div>

				<div className="relative w-full h-[60vh] bg-black">
					{dataUrl && (
						<Cropper
							image={dataUrl}
							crop={crop}
							zoom={zoom}
							aspect={1200 / 630}
							onCropChange={setCrop}
							onZoomChange={setZoom}
							onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPx(croppedAreaPixels)}
							restrictPosition={false}
							zoomWithScroll
							showGrid
						/>
					)}
				</div>

				<div className="flex items-center gap-4 px-4 py-3 border-t">
					<label className="text-sm">ズーム</label>
					<input
						type="range"
						min={1}
						max={3}
						step={0.01}
						value={zoom}
						onChange={e => setZoom(Number(e.target.value))}
						className="w-64"
					/>
					<div className="ml-auto flex items-center gap-2">
						<button
							onClick={onClose}
							className="px-3 py-2 border rounded-sm hover:bg-gray-50"
							disabled={working}
						>
							キャンセル
						</button>
						<button
							onClick={handleApply}
							className="px-3 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:opacity-40"
							disabled={working || !croppedAreaPx}
						>
							{working ? '生成中…' : '適用'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
