'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import NextImage from 'next/image'

type Mode = 'alpha' | 'size'
type FilterMode = 'none' | 'emphasis' | 'only'
type RoleTag = 'primary' | 'accent' | 'neutral' | 'support'

type PaletteEntry = {
    hex: string
    rgb: [number, number, number]
    hsv: [number, number, number]
    ratio: number
    role: RoleTag
    name: string
}

export default function HSVAnalyzer() {
    // 実装の選定理由: 既存のHSV散布に分析(パレット/ヒスト)とハイライトを足すシンプル構成にする
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [sampleStep, setSampleStep] = useState<number>(4)
    const [downscaleWidth, setDownscaleWidth] = useState<number>(512)
    const [mode, setMode] = useState<Mode>('alpha')
    const [showRing, setShowRing] = useState<boolean>(true)

    const [plotCssSize, setPlotCssSize] = useState<number>(512)
    const [hBinsCount, setHBinsCount] = useState<number>(24)
    const [svGrid, setSvGrid] = useState<number>(16)
    const [vBinsCount, setVBinsCount] = useState<number>(16)
    const [paletteSize, setPaletteSize] = useState<number>(8)

    const [palette, setPalette] = useState<PaletteEntry[]>([])
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [filterMode, setFilterMode] = useState<FilterMode>('none')
    const [hTol, setHTol] = useState<number>(20)
    const [sTol, setSTol] = useState<number>(0.2)
    const [vTol, setVTol] = useState<number>(0.2)
    const [highlightAlpha, setHighlightAlpha] = useState<number>(0.5)

    const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const plotCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const plotWrapRef = useRef<HTMLDivElement | null>(null)
    const previewWrapRef = useRef<HTMLDivElement | null>(null)
    const highlightCanvasRef = useRef<HTMLCanvasElement | null>(null)

    const imageDataRef = useRef<ImageData | null>(null)
    const [analysisSize, setAnalysisSize] = useState<{ w: number; h: number }>({
        w: 0,
        h: 0,
    })

    const samplesRef = useRef<{
        r: Uint8ClampedArray | null
        g: Uint8ClampedArray | null
        b: Uint8ClampedArray | null
        h: Float32Array | null
        s: Float32Array | null
        v: Float32Array | null
        count: number
        imgW: number
        imgH: number
        step: number
    }>({
        r: null,
        g: null,
        b: null,
        h: null,
        s: null,
        v: null,
        count: 0,
        imgW: 0,
        imgH: 0,
        step: 1,
    })

    useEffect(() => {
        const handleResize = () => {
            if (!plotWrapRef.current) return
            const rect = plotWrapRef.current.getBoundingClientRect()
            const size = Math.max(300, Math.min(rect.width, 768))
            setPlotCssSize(Math.floor(size))
            drawHighlightOverlay() // 実装の選定理由: プレビューサイズが変わるとハイライトも再描画が必要
        }
        handleResize()
        window.addEventListener('resize', handleResize, { passive: true })
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const onFile = (file: File) => {
        // 実装の選定理由: FileReaderで即時にDataURL化し、ブラウザ内で完結
        if (!file.type.startsWith('image/')) {
            setError('画像ファイルを選んでください')
            return
        }
        setError(null)
        const reader = new FileReader()
        reader.onload = () => setImageSrc(reader.result as string)
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
    const onDragOver: React.DragEventHandler<HTMLLabelElement> = (e) => e.preventDefault()

    useEffect(() => {
        // 実装の選定理由: 画像読み込み後に解析Canvasへ縮小描画してImageData取得
        const run = async () => {
            if (!imageSrc || !analysisCanvasRef.current) {
                imageDataRef.current = null
                setAnalysisSize({ w: 0, h: 0 })
                samplesRef.current = {
                    r: null,
                    g: null,
                    b: null,
                    h: null,
                    s: null,
                    v: null,
                    count: 0,
                    imgW: 0,
                    imgH: 0,
                    step: 1,
                }
                renderPlot()
                return
            }
            const img = new window.Image()
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
                setAnalysisSize({ w, h })
                computeSamples() // 実装の選定理由: 画像変更時にサンプル配列を再構築して即時分析に備える
                renderPlot()
                analyzeAll() // 実装の選定理由: 読み込み後に自動で基本分析を出す
            }
            img.onerror = () => setError('画像の読み込みに失敗しました')
            img.src = imageSrc
        }
        run()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageSrc, downscaleWidth, sampleStep])

    useEffect(() => {
        renderPlot()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, showRing, plotCssSize, filterMode, selectedIndex, hTol, sTol, vTol])

    useEffect(() => {
        drawHighlightOverlay()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIndex, hTol, sTol, vTol, highlightAlpha, imageSrc, analysisSize])

    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

    const rgbToHsv = (r: number, g: number, b: number) => {
        // 実装の選定理由: sRGB→HSVを自前実装して外部依存を排除
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
        // 実装の選定理由: 可視化やスウォッチ生成に必要
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

    const rgbToHex = (r: number, g: number, b: number) => {
        // 実装の選定理由: スウォッチやエクスポートで使う
        const t = (n: number) => n.toString(16).padStart(2, '0')
        return `#${t(r)}${t(g)}${t(b)}`
    }

    const hueName = (h: number) => {
        // 実装の選定理由: おおまかな色名を付与して使いやすくする
        const names = [
            [0, 'Red'],
            [15, 'Orange'],
            [45, 'Yellow'],
            [75, 'Lime'],
            [105, 'Green'],
            [150, 'Cyan'],
            [195, 'Sky'],
            [225, 'Blue'],
            [255, 'Purple'],
            [285, 'Magenta'],
            [315, 'Pink'],
            [345, 'Red'],
        ] as const
        for (let i = names.length - 1; i >= 0; i--) if (h >= names[i][0]) return names[i][1]
        return 'Color'
    }

    const drawHueRing = (ctx: CanvasRenderingContext2D, size: number) => {
        // 実装の選定理由: 直感的理解のための色相環を背景に描く
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

    const matchHSV = (hh: number, ss: number, vv: number, c: PaletteEntry) => {
        // 実装の選定理由: 円環のHue距離とS/Vの許容で一致判定する
        const [H, S, V] = c.hsv
        const dh = Math.min(Math.abs(hh - H), 360 - Math.abs(hh - H))
        return dh <= hTol && Math.abs(ss - S) <= sTol && Math.abs(vv - V) <= vTol
    }

    const renderPlot = () => {
        // 実装の選定理由: HSV散布の再描画。選択スウォッチがあれば強調/限定表示を行う
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
        if (showRing) drawHueRing(ctx, plotCssSize)
        else {
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
        const step = Math.max(1, Math.floor(sampleStep))
        const baseRadius = 1.2
        const sref = samplesRef.current
        if (!sref.h || !sref.s || !sref.v || !sref.r || !sref.g || !sref.b) return
        const sel = selectedIndex != null ? palette[selectedIndex] : null
        for (let i = 0; i < sref.count; i++) {
            const r = sref.r[i]
            const g = sref.g[i]
            const b = sref.b[i]
            const hh = sref.h[i]
            const ss = sref.s[i]
            const vv = sref.v[i]
            const rad = (hh / 360) * Math.PI * 2
            const radius = ss * maxR
            const px = cx + radius * Math.cos(rad)
            const py = cy + radius * Math.sin(rad)
            let alpha = mode === 'alpha' ? clamp(vv, 0.1, 1.0) : 1.0
            const dotR = mode === 'size' ? clamp(0.5 + vv * 1.5, 0.5, 3.0) : baseRadius
            if (sel && filterMode !== 'none') {
                const ok = matchHSV(hh, ss, vv, sel)
                if (!ok && filterMode === 'only') continue
                if (!ok && filterMode === 'emphasis') alpha = 0.08
            }
            const fill = `rgba(${r},${g},${b},${alpha})`
            ctx.beginPath()
            ctx.arc(px, py, dotR, 0, Math.PI * 2)
            ctx.fillStyle = fill
            ctx.fill()
        }
    }

    const computeSamples = () => {
        // 実装の選定理由: 再利用可能なサンプル配列を構築し、分析/描画の両方で使う
        const imgData = imageDataRef.current
        if (!imgData) {
            samplesRef.current.count = 0
            return
        }
        const w = imgData.width,
            h = imgData.height
        const data = imgData.data
        const step = Math.max(1, Math.floor(sampleStep))
        const est = Math.ceil((w * h) / (step * step))
        const rArr = new Uint8ClampedArray(est)
        const gArr = new Uint8ClampedArray(est)
        const bArr = new Uint8ClampedArray(est)
        const hArr = new Float32Array(est)
        const sArr = new Float32Array(est)
        const vArr = new Float32Array(est)
        let idxOut = 0
        for (let y = 0; y < h; y += step) {
            for (let x = 0; x < w; x += step) {
                const idx = (y * w + x) * 4
                const a = data[idx + 3]
                if (a === 0) continue
                const r = data[idx],
                    g = data[idx + 1],
                    b = data[idx + 2]
                const { h: hh, s, v } = rgbToHsv(r, g, b)
                rArr[idxOut] = r
                gArr[idxOut] = g
                bArr[idxOut] = b
                hArr[idxOut] = hh
                sArr[idxOut] = s
                vArr[idxOut] = v
                idxOut++
            }
        }
        samplesRef.current = {
            r: rArr,
            g: gArr,
            b: bArr,
            h: hArr,
            s: sArr,
            v: vArr,
            count: idxOut,
            imgW: w,
            imgH: h,
            step,
        }
    }

    const analyzeAll = () => {
        // 実装の選定理由: パレット、各種ヒストを一括で更新する
        const sref = samplesRef.current
        if (!sref.h || !sref.s || !sref.v) return
        const N = sref.count
        if (N === 0) return

        // Hueヒストグラム
        const hb = hBinsCount
        const hueBins = new Uint32Array(hb)
        for (let i = 0; i < N; i++) {
            const bin = Math.min(hb - 1, Math.floor((sref.h[i] / 360) * hb))
            hueBins[bin]++
        }
        drawHueHistogram(hueBins)

        // SVヒートマップ
        const gsize = svGrid
        const grid = new Uint32Array(gsize * gsize)
        for (let i = 0; i < N; i++) {
            const si = Math.min(gsize - 1, Math.floor(sref.s[i] * gsize))
            const vi = Math.min(gsize - 1, Math.floor(sref.v[i] * gsize))
            grid[vi * gsize + si]++ // vを縦、sを横
        }
        drawSVHeatmap(grid, gsize)

        // Vヒストグラム
        const vb = vBinsCount
        const vBins = new Uint32Array(vb)
        for (let i = 0; i < N; i++) {
            const vi = Math.min(vb - 1, Math.floor(sref.v[i] * vb))
            vBins[vi]++
        }
        drawValueHistogram(vBins)

        // パレット抽出
        const pal = buildPaletteFromHueBins(hueBins, hb, paletteSize, sref)
        setPalette(pal)
    }

    const drawHueHistogram = (bins: Uint32Array) => {
        // 実装の選定理由: ライブラリ不要の軽量グラフをCanvasで描画
        const c = document.getElementById('hueHist') as HTMLCanvasElement | null
        if (!c) return
        const ctx = c.getContext('2d')
        if (!ctx) return
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
        const W = c.clientWidth || 300,
            H = c.clientHeight || 120
        c.width = Math.floor(W * dpr)
        c.height = Math.floor(H * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, W, H)
        const maxv = Math.max(...bins)
        const bw = W / bins.length
        for (let i = 0; i < bins.length; i++) {
            const h0 = (i / bins.length) * 360
            const { r, g, b } = hsvToRgb(h0, 1, 1)
            const v = bins[i] / (maxv || 1)
            const barH = v * (H - 20)
            ctx.fillStyle = `rgb(${r},${g},${b})`
            ctx.fillRect(i * bw + 1, H - barH, bw - 2, barH)
        }
        ctx.strokeStyle = '#e5e7eb'
        ctx.strokeRect(0.5, 0.5, W - 1, H - 1)
    }

    const drawSVHeatmap = (grid: Uint32Array, gsize: number) => {
        // 実装の選定理由: S×V密度をヒートマップで可視化
        const c = document.getElementById('svHeat') as HTMLCanvasElement | null
        if (!c) return
        const ctx = c.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
        const W = c.clientWidth || 300,
            H = c.clientHeight || 180
        c.width = Math.floor(W * dpr)
        c.height = Math.floor(H * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, W, H)
        const maxv = Math.max(...grid)
        const cw = W / gsize,
            ch = H / gsize
        for (let v = 0; v < gsize; v++) {
            for (let s = 0; s < gsize; s++) {
                const val = grid[v * gsize + s] / (maxv || 1)
                const alpha = 0.08 + val * 0.92
                ctx.fillStyle = `rgba(0,0,0,${alpha})`
                ctx.fillRect(s * cw, H - (v + 1) * ch, cw, ch)
            }
        }
        ctx.strokeStyle = '#e5e7eb'
        ctx.strokeRect(0.5, 0.5, W - 1, H - 1)
    }

    const drawValueHistogram = (bins: Uint32Array) => {
        // 実装の選定理由: 明度の分布でコントラスト傾向を掴む
        const c = document.getElementById('vHist') as HTMLCanvasElement | null
        if (!c) return
        const ctx = c.getContext('2d')
        if (!ctx) return
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
        const W = c.clientWidth || 300,
            H = c.clientHeight || 120
        c.width = Math.floor(W * dpr)
        c.height = Math.floor(H * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, W, H)
        const maxv = Math.max(...bins)
        const bw = W / bins.length
        for (let i = 0; i < bins.length; i++) {
            const v = bins[i] / (maxv || 1)
            const barH = v * (H - 20)
            const gray = Math.round((i / (bins.length - 1)) * 255)
            ctx.fillStyle = `rgb(${gray},${gray},${gray})`
            ctx.fillRect(i * bw + 1, H - barH, bw - 2, barH)
        }
        ctx.strokeStyle = '#e5e7eb'
        ctx.strokeRect(0.5, 0.5, W - 1, H - 1)
    }

    const buildPaletteFromHueBins = (
        hueBins: Uint32Array,
        hb: number,
        N: number,
        sref: NonNullable<typeof samplesRef>['current']
    ) => {
        // 実装の選定理由: k-means不要で軽い代表色抽出(上位Hueビンから代表を選ぶ)
        const total = sref.count || 1
        const binsIdx = Array.from({ length: hb }, (_, i) => i).sort((a, b) => hueBins[b] - hueBins[a])
        const chosen: PaletteEntry[] = []
        const minHueDist = 6
        for (const bi of binsIdx) {
            if (hueBins[bi] === 0) continue
            const h0 = (bi + 0.5) * (360 / hb)
            let sumS = 0,
                sumV = 0,
                cnt = 0
            let sumR = 0,
                sumG = 0,
                sumB = 0
            for (let i = 0; i < sref.count; i++) {
                const bin = Math.min(hb - 1, Math.floor((sref.h![i] / 360) * hb))
                if (bin !== bi) continue
                sumS += sref.s![i]
                sumV += sref.v![i]
                sumR += sref.r![i]
                sumG += sref.g![i]
                sumB += sref.b![i]
                cnt++
            }
            if (cnt === 0) continue
            const H = h0 % 360
            const S = clamp(sumS / cnt, 0, 1)
            const V = clamp(sumV / cnt, 0, 1)
            const r = Math.round(sumR / cnt),
                g = Math.round(sumG / cnt),
                b = Math.round(sumB / cnt)
            const hex = rgbToHex(r, g, b)
            const ratio = hueBins[bi] / total
            let role: RoleTag = 'support'
            if (S < 0.25) role = 'neutral'
            else if (ratio < 0.08 && V > 0.5 && S > 0.5) role = 'accent'
            const name = hueName(H)
            const cand: PaletteEntry = {
                hex,
                rgb: [r, g, b],
                hsv: [H, S, V],
                ratio,
                role,
                name,
            }
            let ok = true
            for (const ex of chosen) {
                const dh = Math.min(Math.abs(ex.hsv[0] - H), 360 - Math.abs(ex.hsv[0] - H))
                if (dh < minHueDist) {
                    ok = false
                    break
                }
            }
            if (ok) chosen.push(cand)
            if (chosen.length >= N) break
        }
        chosen.sort((a, b) => b.ratio - a.ratio)
        if (chosen.length > 0) {
            chosen[0].role = chosen[0].role === 'neutral' ? 'neutral' : 'primary'
            if (chosen.length > 1) chosen[1].role = chosen[1].role === 'neutral' ? 'neutral' : 'primary'
        }
        return chosen
    }

    const drawHighlightOverlay = () => {
        // 実装の選定理由: プレビュー上に一致ピクセルだけ半透明で可視化する
        const canvas = highlightCanvasRef.current
        const wrap = previewWrapRef.current
        const imgData = imageDataRef.current
        if (!canvas || !wrap || !imgData) return
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        const wrapRect = wrap.getBoundingClientRect()
        canvas.width = Math.floor(wrapRect.width)
        canvas.height = Math.floor(wrapRect.height)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (selectedIndex == null) return

        const sel = palette[selectedIndex]
        const srcW = analysisSize.w,
            srcH = analysisSize.h
        if (srcW === 0 || srcH === 0) return
        const scale = Math.min(canvas.width / srcW, canvas.height / srcH)
        const drawW = Math.floor(srcW * scale),
            drawH = Math.floor(srcH * scale)
        const offX = Math.floor((canvas.width - drawW) / 2)
        const offY = Math.floor((canvas.height - drawH) / 2)

        const mask = new Uint8ClampedArray(drawW * drawH * 4)
        const sref = samplesRef.current
        if (!sref.h || !sref.s || !sref.v || !sref.r || !sref.g || !sref.b) return

        // 実装の選定理由: 元解析画像サイズ基準でマスクを作り、drawImageで縮小転送する
        const src = imageDataRef.current!
        const srcData = src.data
        const tmp = new ImageData(srcW, srcH)
        for (let y = 0; y < srcH; y++) {
            for (let x = 0; x < srcW; x++) {
                const idx = (y * srcW + x) * 4
                const r = srcData[idx],
                    g = srcData[idx + 1],
                    b = srcData[idx + 2],
                    a = srcData[idx + 3]
                if (a === 0) {
                    tmp.data[idx + 3] = 0
                    continue
                }
                const { h, s, v } = rgbToHsv(r, g, b)
                const ok = matchHSV(h, s, v, sel)
                tmp.data[idx] = sel.rgb[0]
                tmp.data[idx + 1] = sel.rgb[1]
                tmp.data[idx + 2] = sel.rgb[2]
                tmp.data[idx + 3] = ok ? Math.round(clamp(highlightAlpha, 0, 1) * 255) : 0
            }
        }

        const off = document.createElement('canvas')
        off.width = srcW
        off.height = srcH
        const offCtx = off.getContext('2d', { willReadFrequently: true })
        if (!offCtx) return
        offCtx.putImageData(tmp, 0, 0)
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(off, 0, 0, srcW, srcH, offX, offY, drawW, drawH)
    }

    const exportJSON = () => {
        // 実装の選定理由: パレットを他ツールへ持ち出しやすくする
        const data = palette.map((p) => ({
            hex: p.hex,
            rgb: p.rgb,
            hsv: p.hsv,
            ratio: p.ratio,
            role: p.role,
            name: p.name,
        }))
        const blob = new Blob([JSON.stringify({ palette: data }, null, 2)], {
            type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'palette.json'
        a.click()
        URL.revokeObjectURL(url)
    }

    const exportCSV = () => {
        // 実装の選定理由: 表計算や他環境で扱いやすくする
        const header = 'name,role,ratio,hex,r,g,b,h,s,v\n'
        const rows = palette
            .map(
                (p) =>
                    `${p.name},${p.role},${(p.ratio * 100).toFixed(2)}%,${p.hex},${
                        p.rgb[0]
                    },${p.rgb[1]},${p.rgb[2]},${p.hsv[0].toFixed(1)},${p.hsv[1].toFixed(3)},${p.hsv[2].toFixed(3)}`
            )
            .join('\n')
        const blob = new Blob([header + rows], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'palette.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    const exportSwatchPNG = () => {
        // 実装の選定理由: 印刷/共有しやすいスウォッチ画像を出力する
        const W = 720,
            H = 100 + palette.length * 64
        const c = document.createElement('canvas')
        c.width = W
        c.height = H
        const ctx = c.getContext('2d')
        if (!ctx) return
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#111827'
        ctx.font = 'bold 20px sans-serif'
        ctx.fillText('Palette', 24, 36)
        ctx.font = '12px sans-serif'
        ctx.fillText(new Date().toLocaleString(), 24, 58)
        let y = 90
        palette.forEach((p, i) => {
            ctx.fillStyle = p.hex
            ctx.fillRect(24, y - 20, 56, 40)
            ctx.strokeStyle = '#e5e7eb'
            ctx.strokeRect(24.5, y - 19.5, 56, 40)
            ctx.fillStyle = '#111827'
            ctx.font = 'bold 14px sans-serif'
            ctx.fillText(`${i + 1}. ${p.name}  ${p.hex}`, 96, y)
            ctx.font = '12px monospace'
            ctx.fillText(
                `RGB(${p.rgb[0]},${p.rgb[1]},${p.rgb[2]})  HSV(${p.hsv[0].toFixed(
                    1
                )},${p.hsv[1].toFixed(3)},${p.hsv[2].toFixed(3)})  ${(p.ratio * 100).toFixed(2)}%  [${p.role}]`,
                96,
                y + 18
            )
            y += 56
        })
        const url = c.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = url
        a.download = 'palette.png'
        a.click()
    }

    const exportPlotPNG = () => {
        // 実装の選定理由: 現在のHS散布図を保存する
        const canvas = plotCanvasRef.current
        if (!canvas) return
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = 'hsv_plot.png'
        a.click()
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
            <header className="space-y-1">
                <h1 className="text-xl font-semibold">Color Range Analyzer（HSV）</h1>
                <p className="text-sm text-gray-600">参考イラストの色域を分析し、パレット・分布を可視化します。</p>
            </header>

            <section className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-3 lg:col-span-1">
                    <label
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        className="block rounded border border-dashed border-gray-300 p-4 text-center cursor-pointer hover:bg-gray-50"
                    >
                        <span className="block text-sm font-medium mb-2">画像を選択（クリック or ドロップ）</span>
                        <input type="file" accept="image/*" onChange={onInputChange} className="hidden" />
                        <span className="text-xs text-gray-500">PNG / JPEG / WebP / GIF(先頭フレーム)</span>
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
                                className="w-40"
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
                                className="w-40"
                            />
                        </label>
                        <fieldset className="space-y-1">
                            <legend className="text-sm font-medium">散布表示モード</legend>
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
                            <span>色相環を表示</span>
                        </label>

                        <div className="flex flex-wrap gap-2 pt-2">
                            <button
                                type="button"
                                onClick={analyzeAll}
                                className="px-3 py-1.5 rounded bg-black text-white text-sm hover:opacity-90"
                            >
                                分析を実行
                            </button>
                            <button
                                type="button"
                                onClick={exportPlotPNG}
                                className="px-3 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50"
                            >
                                散布図PNG
                            </button>
                            <button
                                type="button"
                                onClick={exportJSON}
                                className="px-3 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50"
                            >
                                JSON
                            </button>
                            <button
                                type="button"
                                onClick={exportCSV}
                                className="px-3 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50"
                            >
                                CSV
                            </button>
                            <button
                                type="button"
                                onClick={exportSwatchPNG}
                                className="px-3 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50"
                            >
                                パレットPNG
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm font-medium">スウォッチ選択で画像をハイライト</div>
                        <div className="flex items-center gap-2">
                            <label className="">強調</label>
                            <select
                                value={filterMode}
                                onChange={(e) => setFilterMode(e.currentTarget.value as FilterMode)}
                                className="border rounded p-2 text-md"
                            >
                                <option value="none">なし</option>
                                <option value="emphasis">対象強調</option>
                                <option value="only">対象のみ</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <label className="text-xs flex items-center">
                                Hue ±<b>{hTol}</b>°
                                <input
                                    type="range"
                                    min={2}
                                    max={60}
                                    step={1}
                                    value={hTol}
                                    onChange={(e) => setHTol(e.currentTarget.valueAsNumber)}
                                    className="w-24"
                                />
                            </label>
                            <label className="text-xs flex items-center">
                                S ±<b>{sTol.toFixed(2)}</b>
                                <input
                                    type="range"
                                    min={0.05}
                                    max={0.5}
                                    step={0.01}
                                    value={sTol}
                                    onChange={(e) => setSTol(e.currentTarget.valueAsNumber)}
                                    className="w-24"
                                />
                            </label>
                            <label className="text-xs flex items-center">
                                V ±<b>{vTol.toFixed(2)}</b>
                                <input
                                    type="range"
                                    min={0.05}
                                    max={0.5}
                                    step={0.01}
                                    value={vTol}
                                    onChange={(e) => setVTol(e.currentTarget.valueAsNumber)}
                                    className="w-24"
                                />
                            </label>
                            <label className="text-xs flex items-center">
                                ハイライト不透明度 <b>{highlightAlpha.toFixed(2)}</b>
                                <input
                                    type="range"
                                    min={0.1}
                                    max={0.9}
                                    step={0.01}
                                    value={highlightAlpha}
                                    onChange={(e) => setHighlightAlpha(e.currentTarget.valueAsNumber)}
                                    className="w-40"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 lg:col-span-2">
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <div ref={plotWrapRef} className="w-full">
                                <div className="w-full aspect-square rounded border border-gray-200 bg-white overflow-hidden">
                                    <canvas ref={plotCanvasRef} className="w-full h-full block" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                H=角度、S=半径、Vはモードでα/サイズに反映。選択スウォッチに応じて強調/限定表示ができます。
                            </p>
                        </div>

                        <div>
                            <div
                                ref={previewWrapRef}
                                className="relative w-full h-64 rounded border border-gray-200 overflow-hidden bg-white"
                            >
                                {imageSrc && (
                                    <NextImage
                                        src={imageSrc}
                                        alt="プレビュー"
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        className="object-contain"
                                        priority
                                        unoptimized
                                    />
                                )}
                                <canvas ref={highlightCanvasRef} className="absolute inset-0 pointer-events-none" />
                            </div>
                            <p className="text-xs text-gray-500">
                                スウォッチをクリックすると該当色域が半透明で表示されます。
                            </p>
                        </div>
                    </div>

                    <div className="rounded border border-gray-200">
                        <div className="px-3 py-2 border-b text-sm font-medium">
                            代表色パレット（上位 {paletteSize} 色）
                        </div>
                        <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-2 p-3">
                            {palette.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedIndex(i)}
                                    className={`flex items-center gap-3 p-2 rounded border ${
                                        selectedIndex === i ? 'border-black' : 'border-gray-200'
                                    } text-left`}
                                >
                                    <span className="w-12 h-12 rounded" style={{ backgroundColor: p.hex }} />
                                    <span className="text-sm">
                                        <span className="block font-medium">
                                            {i + 1}. {p.name} <span className="text-xs text-gray-500">{p.hex}</span>
                                        </span>
                                        <span className="block text-xs text-gray-600">
                                            {(p.ratio * 100).toFixed(2)}% · {p.role}
                                        </span>
                                    </span>
                                </button>
                            ))}
                            {palette.length === 0 && (
                                <div className="text-sm text-gray-500 col-span-full">
                                    画像を読み込んで「分析を実行」してね。
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                        <div className="rounded border border-gray-200">
                            <div className="px-3 py-2 border-b text-sm font-medium">Hueヒストグラム</div>
                            <div className="p-3">
                                <div className="h-28 w-full">
                                    <canvas id="hueHist" className="w-full h-full" />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-xs text-gray-600">ビン数: {hBinsCount}</span>
                                    <input
                                        type="range"
                                        min={12}
                                        max={72}
                                        step={6}
                                        value={hBinsCount}
                                        onChange={(e) => setHBinsCount(e.currentTarget.valueAsNumber)}
                                        className="w-32"
                                        onMouseUp={analyzeAll}
                                        onTouchEnd={analyzeAll}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-200">
                            <div className="px-3 py-2 border-b text-sm font-medium">SVヒートマップ</div>
                            <div className="p-3">
                                <div className="h-40 w-full">
                                    <canvas id="svHeat" className="w-full h-full" />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-xs text-gray-600">
                                        グリッド: {svGrid}×{svGrid}
                                    </span>
                                    <input
                                        type="range"
                                        min={8}
                                        max={32}
                                        step={1}
                                        value={svGrid}
                                        onChange={(e) => setSvGrid(e.currentTarget.valueAsNumber)}
                                        className="w-32"
                                        onMouseUp={analyzeAll}
                                        onTouchEnd={analyzeAll}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-200">
                            <div className="px-3 py-2 border-b text-sm font-medium">明度ヒストグラム</div>
                            <div className="p-3">
                                <div className="h-28 w-full">
                                    <canvas id="vHist" className="w-full h-full" />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-xs text-gray-600">ビン数: {vBinsCount}</span>
                                    <input
                                        type="range"
                                        min={8}
                                        max={64}
                                        step={1}
                                        value={vBinsCount}
                                        onChange={(e) => setVBinsCount(e.currentTarget.valueAsNumber)}
                                        className="w-32"
                                        onMouseUp={analyzeAll}
                                        onTouchEnd={analyzeAll}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <canvas ref={analysisCanvasRef} className="hidden" />
        </div>
    )
}
