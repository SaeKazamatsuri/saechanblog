'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import gsap from 'gsap'
import Image from 'next/image'

export default function IrisOverlay() {
    const overlayRef = useRef<HTMLDivElement>(null)
    const imgWrapRef = useRef<HTMLDivElement>(null)
    const transitionCoverRef = useRef<HTMLDivElement>(null)

    const router = useRouter()
    const pathname = usePathname()
    const firstLoadDoneRef = useRef(false)
    const transitionStartTimeRef = useRef<number | null>(null)
    const [enabled] = useState(true)

    // 画面の長い辺を基準にした正方形ひし形を返す
    const makeDiamondPolygon = (sizeVMaxPct: number) => {
        const overlay = overlayRef.current
        if (!overlay) return 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)'
        const rect = overlay.getBoundingClientRect()
        const w = rect.width
        const h = rect.height
        const vmax = Math.max(w, h)
        const sizePx = (vmax * sizeVMaxPct) / 100
        const xPct = (sizePx / w) * 100
        const yPct = (sizePx / h) * 100
        return `polygon(50% ${50 - yPct}%, ${50 + xPct}% 50%, 50% ${50 + yPct}%, ${50 - xPct}% 50%)`
    }

    // 初期化
    useEffect(() => {
        // カバーと画像は最初は非表示
        gsap.set(transitionCoverRef.current, { autoAlpha: 0 })
        gsap.set(imgWrapRef.current, { autoAlpha: 0, scale: 1 })
    }, [])

    // クリックで退出トランジション
    useEffect(() => {
        if (!enabled) return
        const overlay = overlayRef.current
        const imgWrap = imgWrapRef.current
        const cover = transitionCoverRef.current
        if (!overlay || !imgWrap || !cover) return

        const onClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a')
            if (!target) return
            const href = target.getAttribute('href')
            if (!href) return
            if (target.target === '_blank' || href.startsWith('#') || target.hasAttribute('data-no-transition')) return

            const url = new URL(href, window.location.origin)
            if (url.origin !== window.location.origin) return
            if (url.pathname === pathname) return

            e.preventDefault()
            transitionStartTimeRef.current = Date.now()

            // オーバーレイを表示し、開始状態を明示セット
            gsap.set(overlay, { display: 'block' })
            gsap.set(cover, { autoAlpha: 0, clipPath: makeDiamondPolygon(0) })
            gsap.set(imgWrap, { autoAlpha: 0, scale: 0.92 })

            // 退出アニメーション：カバー拡大と画像フェードイン＋微スケール
            const tlOut = gsap.timeline({
                defaults: { ease: 'power3.inOut' },
            })

            // 画像は先に柔らかく見せてからカバーで包む
            tlOut.to(imgWrap, { autoAlpha: 1, scale: 1, duration: 0.45 }, 0)
            tlOut.to(
                cover,
                {
                    autoAlpha: 1,
                    clipPath: makeDiamondPolygon(100),
                    duration: 0.6,
                },
                0
            )

            tlOut.add(() => {
                router.push(url.pathname + url.search + url.hash)
            })
        }

        document.addEventListener('click', onClick)
        return () => document.removeEventListener('click', onClick)
    }, [enabled, router, pathname])

    // パス変更後＝到着側トランジション
    useEffect(() => {
        const overlay = overlayRef.current
        const imgWrap = imgWrapRef.current
        const cover = transitionCoverRef.current
        if (!overlay || !imgWrap || !cover) return

        if (!firstLoadDoneRef.current) {
            firstLoadDoneRef.current = true
            return
        }

        if (transitionStartTimeRef.current === null) {
            gsap.set(overlay, { display: 'none' })
            return
        }

        const elapsedTime = Date.now() - transitionStartTimeRef.current
        const delay = Math.max(0, 1000 - elapsedTime) / 1000

        const playArrivalAnimation = () => {
            // 退出の続きからスタート
            gsap.set(overlay, { display: 'block' })
            gsap.set(cover, { autoAlpha: 1, clipPath: makeDiamondPolygon(100) })
            gsap.set(imgWrap, { autoAlpha: 1, scale: 1.0 })

            // 到着アニメ：カバー収縮と画像フェードアウト＋微スケールダウン
            const tlIn = gsap.timeline({
                defaults: { ease: 'power3.inOut' },
                onComplete: () => {
                    gsap.set(overlay, { display: 'none' })
                    gsap.set(imgWrap, { autoAlpha: 0, scale: 1 })
                    transitionStartTimeRef.current = null
                },
            })

            // 画像はカバーよりほんの少し先に溶け始める
            tlIn.to(imgWrap, { autoAlpha: 0, scale: 0.96, duration: 0.6 }, 0.05)
            tlIn.to(cover, { clipPath: makeDiamondPolygon(0), duration: 0.6 }, 0)
            tlIn.to(cover, { autoAlpha: 0, duration: 0.12 }, '-=0.05')
        }

        gsap.delayedCall(delay, playArrivalAnimation)
    }, [pathname])

    return (
        <div
            ref={overlayRef}
            style={{
                pointerEvents: 'none',
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'none',
                // 合成安定化
                willChange: 'opacity, transform',
                backfaceVisibility: 'hidden',
            }}
        >
            {/* 退出・到着アニメーションで共用するカバー */}
            <div
                ref={transitionCoverRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#ffffff',
                    // clip-pathとopacityを頻繁に変えるためのヒント
                    willChange: 'clip-path, opacity',
                    backfaceVisibility: 'hidden',
                    contain: 'layout paint style size',
                }}
                aria-hidden
            />

            {/* 中央画像 */}
            <div
                ref={imgWrapRef}
                className="relative overflow-hidden"
                style={{
                    position: 'absolute',
                    width: '40vmin',
                    height: '40vmin',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    transformOrigin: '50% 50%',
                    zIndex: 1,
                    willChange: 'transform, opacity',
                    backfaceVisibility: 'hidden',
                }}
            >
                <Image
                    src="/image/transition.webp"
                    alt="ショートランドのこかげ"
                    fill
                    className="object-cover select-none pointer-events-none"
                    sizes="(min-width: 1024px) 40vmin, 40vmin"
                    priority
                />
            </div>
        </div>
    )
}
