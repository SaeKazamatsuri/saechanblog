'use client'

import { useEffect, useRef, useState } from 'react'

// 機能: クリップボード/フォルダから画像選択モーダル
type Props = {
    open: boolean
    onClose: () => void
    onSelect: (file: File) => void
}

export default function PasteSelectModal({ open, onClose, onSelect }: Props) {
    // 変数: ローカルプレビューURL
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // 関数: MIME→拡張子
    const mimeToExt = (mime: string) => {
        if (mime === 'image/png') return 'png'
        if (mime === 'image/jpeg') return 'jpg'
        if (mime === 'image/gif') return 'gif'
        if (mime === 'image/webp') return 'webp'
        return 'png'
    }

    // 関数: クリップボード画像取り込み
    const handlePaste = (e: ClipboardEvent) => {
        if (!open) return
        const items = e.clipboardData?.items
        if (!items) return
        for (const item of items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                const blob = item.getAsFile()
                if (blob) {
                    const ext = mimeToExt(blob.type)
                    const file = new File([blob], `pasted-${Date.now()}.${ext}`, { type: blob.type })
                    onSelect(file)
                    setPreviewUrl(URL.createObjectURL(file))
                    e.preventDefault()
                    break
                }
            }
        }
    }

    useEffect(() => {
        if (!open) return
        containerRef.current?.focus()
        const onPasteWindow = (ev: ClipboardEvent) => handlePaste(ev)
        window.addEventListener('paste', onPasteWindow)
        return () => {
            window.removeEventListener('paste', onPasteWindow)
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
    }, [open])

    // 関数: ファイル選択
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onSelect(file)
            setPreviewUrl(URL.createObjectURL(file))
            e.currentTarget.value = ''
        }
    }

    // 関数: ダイアログ表示
    const openFileDialog = () => fileInputRef.current?.click()

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div
                ref={containerRef}
                tabIndex={-1}
                className="relative z-[1001] w-[min(680px,92vw)] bg-white border border-gray-300 rounded-sm p-6 space-y-4"
                onPaste={(e) => handlePaste(e.nativeEvent)}
            >
                <div className="text-sm text-gray-600">
                    Ctrl+V で画像を貼り付け / フォルダから選択でファイルを選べます
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={openFileDialog}
                        className="h-[40px] bg-gray-100 hover:bg-gray-200 transition border border-gray-300 px-3 rounded-sm"
                    >
                        フォルダから選択
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleInputChange}
                        className="hidden"
                    />
                    <button
                        onClick={onClose}
                        className="h-[40px] bg-white hover:bg-gray-50 transition border border-gray-300 px-3 rounded-sm"
                    >
                        閉じる
                    </button>
                </div>

                {previewUrl && (
                    <div className="border border-gray-200 p-3 rounded-sm">
                        <img src={previewUrl} alt="preview" className="max-h-[40vh] object-contain mx-auto" />
                    </div>
                )}
            </div>
        </div>
    )
}
