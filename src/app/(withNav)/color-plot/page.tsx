'use client'

import React, { useEffect, useRef, useState } from 'react'
import NextImage from 'next/image'

type Mode = 'alpha' | 'size'

export default function HSVPlotter() {
    // 実装の選定理由: ライブラリなしで学習しやすい構成にし、Canvasで多数点の描画性能を確保する
    const [imageSrc, setImageSrc] = useState<string | null>(null) // 画像のデータURL
    const [error, setError] = useState<string | null>(null) // エラーメッセージ
    const [sampleStep, setSampleStep] = useState<number>(4) // サンプリング間隔
    const [downscaleWidth, setDownscaleWidth] = useState<number>(512) // 解析用最大幅
    const [mode, setMode] = useState<Mode>('alpha') // 表示モード
    const [showRing, setShowRing] = useState<boolean>(true) // 背景リングON/OFF

    const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null) // 解析用(非表示)キャンバス
    const plotCanvasRef = useRef<HTMLCanvasElement | null>(null) // 表示用キャンバス
    const plotWrapRef = useRef<HTMLDivElement | null>(null) // キャンバスサイズ測定用

    const imageDataRef = useRef<ImageData | null>(null) // 解析済みピクセル
    const [plotCssSize, setPlotCssSize] = useState<number>(512) // CSS上の正方サイズ(px)

    useEffect(() => {
        const handleResize = () => {
            if (!plotWrapRef.current) return
            const rect = plotWrapRef.current.getBoundingClientRect()
            const size = Math.max(300, Math.min(rect.width, 768))
            setPlotCssSize(Math.floor(size))
        }
        handleResize()
        window.addEventListener('resize', handleResize, { passive: true })
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const onFile = (file: File) => {
        // 実装の選定理由: FileReaderで即座にDataURL化し、ブラウザ内で完結する
        if (!file.type.startsWith('image/')) {
            setError('画像ファイルを選んでください')
            return
        }
        setError(null)
        const reader = new FileReader()
        reader.onload = () => {
            setImageSrc(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0]
        if (file) onFile(file)
    }

    const onDrop: React.DragEventHandler<HTMLLabelElement> = (e) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file) onFile(file)
    }

    const onDragOver: React.DragEventHandler<HTMLLabelElement> = (e) => {
        e.preventDefault()
    }

    useEffect(() => {
        // 画像読み込み→解析キャンバスに縮小描画→ImageData保持
        const run = async () => {
            if (!imageSrc || !analysisCanvasRef.current) {
                imageDataRef.current = null
                renderPlot()
                return
            }
            const img = new window.Image() // 実装の選定理由: next/imageとの名前衝突を避け、DOMのImageコンストラクタを明示
            img.onload = () => {
                const aCanvas = analysisCanvasRef.current!
                const aCtx = aCanvas.getContext('2d', { willReadFrequently: true })
                if (!aCtx) return

                const scale = img.width > downscaleWidth ? downscaleWidth / img.width : 1
                const w = Math.max(1, Math.floor(img.width * scale))
                const h = Math.max(1, Math.floor(img.height * scale))
                aCanvas.width = w
                aCanvas.height = h
                aCtx.clearRect(0, 0, w, h)
                aCtx.drawImage(img, 0, 0, w, h)
                imageDataRef.current = aCtx.getImageData(0, 0, w, h)
                renderPlot()
            }
            img.onerror = () => {
                setError('画像の読み込みに失敗しました')
            }
            img.src = imageSrc
        }
        run()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageSrc, downscaleWidth])

    useEffect(() => {
        renderPlot()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sampleStep, mode, showRing, plotCssSize])

    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

    const rgbToHsv = (r: number, g: number, b: number) => {
        // 実装の選定理由: sRGB→HSVを自前実装し、外部依存を排除
        const rn = r / 255,
            gn = g / 255,
            bn = b / 255
        const max = Math.max(rn, gn, bn)
        const min = Math.min(rn, gn, bn)
        const d = max - min
        let h = 0
        if (d !== 0) {
            switch (max) {
                case rn:
                    h = 60 * (((gn - bn) / d) % 6)
                    break
                case gn:
                    h = 60 * ((bn - rn) / d + 2)
                    break
                default:
                    h = 60 * ((rn - gn) / d + 4)
            }
        }
        if (h < 0) h += 360
        const s = max === 0 ? 0 : d / max
        const v = max
        return { h, s, v }
    }

    const hsvToRgb = (h: number, s: number, v: number) => {
        // 実装の選定理由: 色相環リング用にHSV→RGBを用意
        const c = v * s
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
        const m = v - c
        let rp = 0,
            gp = 0,
            bp = 0
        if (0 <= h && h < 60) {
            rp = c
            gp = x
            bp = 0
        } else if (60 <= h && h < 120) {
            rp = x
            gp = c
            bp = 0
        } else if (120 <= h && h < 180) {
            rp = 0
            gp = c
            bp = x
        } else if (180 <= h && h < 240) {
            rp = 0
            gp = x
            bp = c
        } else if (240 <= h && h < 300) {
            rp = x
            gp = 0
            bp = c
        } else {
            rp = c
            gp = 0
            bp = x
        }
        const r = Math.round((rp + m) * 255)
        const g = Math.round((gp + m) * 255)
        const b = Math.round((bp + m) * 255)
        return { r, g, b }
    }

    const drawHueRing = (ctx: CanvasRenderingContext2D, size: number) => {
        // 実装の選定理由: 直感的理解を助ける補助リングを低コストで描画
        const pad = 8
        const cx = size / 2
        const cy = size / 2
        const outerR = size / 2 - pad
        ctx.clearRect(0, 0, size, size)

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 1
        const rings = [0.25, 0.5, 0.75, 1.0]
        rings.forEach((s) => {
            ctx.beginPath()
            ctx.arc(cx, cy, outerR * s, 0, Math.PI * 2)
            ctx.stroke()
        })

        ctx.lineWidth = 4
        for (let deg = 0; deg < 360; deg += 2) {
            const { r, g, b } = hsvToRgb(deg, 1, 1)
            ctx.strokeStyle = `rgb(${r},${g},${b})`
            const start = ((deg - 1) * Math.PI) / 180
            const end = ((deg + 1) * Math.PI) / 180
            ctx.beginPath()
            ctx.arc(cx, cy, outerR, start, end)
            ctx.stroke()
        }
    }

    const renderPlot = () => {
        // 実装の選定理由: DPI対応でCanvas描画を高精細化し、パラメータ変更時に都度再描画する
        const canvas = plotCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
        canvas.width = Math.floor(plotCssSize * dpr)
        canvas.height = Math.floor(plotCssSize * dpr)
        canvas.style.width = `${plotCssSize}px`
        canvas.style.height = `${plotCssSize}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        if (showRing) {
            drawHueRing(ctx, plotCssSize)
        } else {
            ctx.clearRect(0, 0, plotCssSize, plotCssSize)
            ctx.fillStyle = '#fff'
            ctx.fillRect(0, 0, plotCssSize, plotCssSize)
        }

        const pad = 8
        const cx = plotCssSize / 2
        const cy = plotCssSize / 2
        const maxR = plotCssSize / 2 - pad

        const imgData = imageDataRef.current
        if (!imgData) return

        const w = imgData.width
        const h = imgData.height
        const data = imgData.data

        const step = Math.max(1, Math.floor(sampleStep))
        const baseRadius = 1.2

        for (let y = 0; y < h; y += step) {
            for (let x = 0; x < w; x += step) {
                const idx = (y * w + x) * 4
                const r = data[idx]
                const g = data[idx + 1]
                const b = data[idx + 2]
                const a = data[idx + 3]
                if (a === 0) continue

                const { h: hh, s, v } = rgbToHsv(r, g, b)
                const rad = (hh / 360) * Math.PI * 2
                const radius = s * maxR
                const px = cx + radius * Math.cos(rad)
                const py = cy + radius * Math.sin(rad)

                const alpha = mode === 'alpha' ? clamp(v, 0.1, 1.0) : 1.0
                const dotR = mode === 'size' ? clamp(0.5 + v * 1.5, 0.5, 3.0) : baseRadius

                ctx.beginPath()
                ctx.arc(px, py, dotR, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
                ctx.fill()
            }
        }
    }

    const exportPNG = () => {
        // 実装の選定理由: 現在の可視状態をそのままPNGに保存できるようにする
        const canvas = plotCanvasRef.current
        if (!canvas) return
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = 'hsv_plot.png'
        a.click()
    }

    const clearAll = () => {
        // 実装の選定理由: 解析状態を初期化して再スタートを容易にする
        setImageSrc(null)
        imageDataRef.current = null
        const aCanvas = analysisCanvasRef.current
        if (aCanvas) {
            aCanvas.width = 0
            aCanvas.height = 0
        }
        renderPlot()
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
            <header className="space-y-1">
                <h1 className="text-xl font-semibold">HSV Plotter (H=角度, S=半径, V=α/サイズ)</h1>
                <p className="text-sm text-gray-600">
                    画像の色をHSV空間に2D極座標で散布します。Vは表示モードで表現方法が変わります。
                </p>
            </header>

            <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                    <label
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        className="block rounded border border-dashed border-gray-300 p-4 text-center cursor-pointer hover:bg-gray-50"
                    >
                        <span className="block text-sm font-medium mb-2">画像を選択（クリック or ドロップ）</span>
                        <input type="file" accept="image/*" onChange={onInputChange} className="hidden" />
                        <span className="text-xs text-gray-500">PNG / JPEG / WebP / GIF(1フレーム)</span>
                    </label>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="space-y-2">
                        <label className="flex items-center justify-between">
                            <span className="text-sm">
                                サンプリング間隔: <b>{sampleStep}</b> px
                            </span>
                            <input
                                type="range"
                                min={1}
                                max={16}
                                step={1}
                                value={sampleStep}
                                onChange={(e) => setSampleStep(e.currentTarget.valueAsNumber)}
                                aria-label="サンプリング間隔"
                                className="w-48"
                            />
                        </label>

                        <label className="flex items-center justify-between">
                            <span className="text-sm">
                                解析最大幅: <b>{downscaleWidth}</b> px
                            </span>
                            <input
                                type="range"
                                min={128}
                                max={1024}
                                step={64}
                                value={downscaleWidth}
                                onChange={(e) => setDownscaleWidth(e.currentTarget.valueAsNumber)}
                                aria-label="解析最大幅"
                                className="w-48"
                            />
                        </label>

                        <fieldset className="space-y-1">
                            <legend className="text-sm font-medium">表示モード</legend>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="mode"
                                    value="alpha"
                                    checked={mode === 'alpha'}
                                    onChange={() => setMode('alpha')}
                                />
                                <span>HS + Alpha(V)</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="mode"
                                    value="size"
                                    checked={mode === 'size'}
                                    onChange={() => setMode('size')}
                                />
                                <span>HS + Size(V)</span>
                            </label>
                        </fieldset>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={showRing}
                                onChange={(e) => setShowRing(e.currentTarget.checked)}
                            />
                            <span>背景リングを表示</span>
                        </label>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={clearAll}
                                className="px-3 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50"
                            >
                                クリア
                            </button>
                            <button
                                type="button"
                                onClick={exportPNG}
                                className="px-3 py-1.5 rounded bg-black text-white text-sm hover:opacity-90"
                            >
                                エクスポートPNG
                            </button>
                        </div>
                    </div>

                    {imageSrc && (
                        <figure className="pt-2">
                            <figcaption className="text-sm text-gray-600 mb-1">プレビュー</figcaption>
                            <div className="relative w-full h-48 rounded border border-gray-200 overflow-hidden bg-white">
                                <NextImage
                                    src={imageSrc}
                                    alt="選択画像プレビュー"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-contain"
                                    priority
                                    unoptimized
                                />
                            </div>
                        </figure>
                    )}
                </div>

                <div className="space-y-2">
                    <div ref={plotWrapRef} className="w-full">
                        <div className="w-full aspect-square rounded border border-gray-200 bg-white overflow-hidden">
                            <canvas ref={plotCanvasRef} className="w-full h-full block" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        キャンバスサイズはコンテナ幅に追従します（最小300px）。高DPIに対応しています。
                    </p>
                </div>
            </section>

            <canvas ref={analysisCanvasRef} className="hidden" />
        </div>
    )
}
