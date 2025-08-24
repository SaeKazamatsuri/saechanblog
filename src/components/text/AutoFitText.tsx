'use client'

import React, { useRef, useLayoutEffect, useEffect, useState } from 'react'

type Props = {
    // 子要素に表示したいテキスト（基本はプレーンテキスト推奨。インライン要素は可）
    children: React.ReactNode
    // 文字色
    color?: 'white' | 'black'
    // true のとき中央揃え（ブロック自体も中央に配置する）
    center?: boolean
    // true のとき太字
    bold?: boolean
    // コンポーネントの最大幅(px)
    maxWidth?: number
    // 最小フォントサイズ(px)
    minFontSize?: number
    // 最大フォントサイズ(px)
    maxFontSize?: number
    // 二分探索の精度(px)
    precision?: number
    // 追加クラス
    className?: string
    // 追加スタイル
    style?: React.CSSProperties
}

const AutoFitText: React.FC<Props> = ({
    children,
    color = 'black',
    center = true,
    bold = false,
    maxWidth = 800,
    minFontSize = 12,
    maxFontSize = 64,
    precision = 0.5,
    className,
    style,
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const textRef = useRef<HTMLSpanElement | null>(null)
    const rafRef = useRef<number | null>(null)
    const debounceTimer = useRef<number | null>(null)
    const [appliedFontSize, setAppliedFontSize] = useState<number | undefined>(undefined)

    // 親幅に収めるための二分探索。scrollWidth を使って必要幅を測る
    const fit = () => {
        const el = textRef.current
        const container = containerRef.current
        if (!el || !container) return

        const available = container.clientWidth
        if (available <= 0) return

        let low = minFontSize
        let high = maxFontSize
        let best = minFontSize

        while (high - low > precision) {
            const mid = (low + high) / 2
            el.style.fontSize = mid + 'px'
            const needed = el.scrollWidth
            if (needed <= available) {
                best = mid
                low = mid
            } else {
                high = mid
            }
        }

        setAppliedFontSize(Math.floor(best * 10) / 10)
    }

    // フォント読み込み完了を待ってから fit。リサイズ連打対策でデバウンス
    const scheduleFit = (wait = 60) => {
        if (debounceTimer.current) window.clearTimeout(debounceTimer.current)
        debounceTimer.current = window.setTimeout(() => {
            if ('fonts' in document && (document as any).fonts?.ready) {
                ;(document as any).fonts.ready
                    .then(() => {
                        fit()
                    })
                    .catch(() => fit())
            } else {
                fit()
            }
        }, wait)
    }

    // 初回・依存変更時に実行。ResizeObserver で幅変化も監視
    useLayoutEffect(() => {
        scheduleFit(0)

        const container = containerRef.current
        if (!container) return

        const ro = new ResizeObserver(() => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(() => {
                scheduleFit()
            })
        })
        ro.observe(container)

        const onWin = () => {
            scheduleFit()
        }
        window.addEventListener('resize', onWin)

        return () => {
            ro.disconnect()
            window.removeEventListener('resize', onWin)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            if (debounceTimer.current) window.clearTimeout(debounceTimer.current)
        }
        // children を含めて再計算する。子が変わればサイズも変わるため
    }, [children, maxWidth, minFontSize, maxFontSize, precision, center, bold])

    // 計算したフォントサイズを実要素へ反映
    useEffect(() => {
        const el = textRef.current
        if (!el) return
        if (appliedFontSize != null) el.style.fontSize = appliedFontSize + 'px'
    }, [appliedFontSize])

    // 中央配置の体験を素直にするため、center=true のときはブロック自体も中央寄せ
    return (
        <p
            ref={containerRef}
            className={className}
            style={{
                width: '95vw',
                maxWidth: `${maxWidth}px`,
                margin: center ? '0 auto' : undefined, // ブロックを中央に配置
                boxSizing: 'border-box',
                overflow: 'hidden',
                textAlign: center ? 'center' : 'left',
                ...style,
            }}
        >
            <span
                ref={textRef}
                style={{
                    display: 'inline-block',
                    whiteSpace: 'nowrap', // 1行でフィットさせる設計
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1,
                    color: color === 'white' ? '#ffffff' : '#000000',
                    fontWeight: bold ? 700 : 400,
                    fontSize: appliedFontSize ? `${appliedFontSize}px` : undefined,
                }}
            >
                {children}
            </span>
        </p>
    )
}

export default AutoFitText
