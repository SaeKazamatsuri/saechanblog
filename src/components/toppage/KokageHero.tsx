'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'

type BubbleSpec = { left: number; size: number; delay: number }

export default function KokageHero() {
    const root = useRef<HTMLDivElement | null>(null)
    const hasAnimated = useRef(false)

    const title = 'ショートランドのこかげ'
    const chars = useMemo(() => [...title], [title])

    const [bubbles, setBubbles] = useState<BubbleSpec[]>([])
    const [sparkles, setSparkles] = useState<{ left: number; top: number }[]>([])

    useEffect(() => {
        // 泡をたくさん小さめで生成
        const newBubbles = Array.from({ length: 40 }).map(() => ({
            left: Math.random() * 100,
            size: 2 + Math.random() * 8,
            delay: Math.random() * 2,
        }))
        setBubbles(newBubbles)

        const newSparkles = Array.from({ length: 10 }).map(() => ({
            left: Math.random() * 100,
            top: Math.random() * 100,
        }))
        setSparkles(newSparkles)
    }, [])

    useEffect(() => {
        if (hasAnimated.current) return
        hasAnimated.current = true

        const prefersReduced =
            typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

        const ctx = gsap.context(() => {
            gsap.set('.char', { display: 'inline-block', transformPerspective: 400 })
            gsap.set('.underline', { scaleX: 0, transformOrigin: 'left center' })
            gsap.set('.wave', { yPercent: 15 })
            gsap.set('.diamond', { yPercent: -10, rotate: -15 })

            // タイトル文字
            gsap.fromTo(
                '.char',
                { yPercent: 120, opacity: 0, rotateX: 70, scale: 0.9 },
                {
                    yPercent: 0,
                    opacity: 1,
                    rotateX: 0,
                    scale: 1,
                    ease: 'expo.out',
                    duration: 1.1,
                    stagger: 0.06,
                }
            )

            gsap.to('.underline', {
                scaleX: 1,
                ease: 'expo.out',
                duration: 1,
                delay: 0.3,
            })

            // 波・ひし形（前回と同じ）
            const waveDur = 6
            gsap.to('#wave1', { yPercent: 0, ease: 'sine.out', duration: 1.2 })
            gsap.to('#wave2', { yPercent: 0, ease: 'sine.out', duration: 1.4, delay: 0.1 })
            gsap.to('#wave3', { yPercent: 0, ease: 'sine.out', duration: 1.6, delay: 0.2 })
            if (!prefersReduced) {
                gsap.to('#wave1', {
                    xPercent: -10,
                    scaleX: 1.05,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut',
                    duration: waveDur,
                })
                gsap.to('#wave2', {
                    xPercent: 8,
                    rotate: 1,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut',
                    duration: waveDur * 1.2,
                })
                gsap.to('#wave3', {
                    xPercent: -6,
                    scaleY: 1.1,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut',
                    duration: waveDur * 1.4,
                })
            }
            if (!prefersReduced) {
                gsap.to('.diamond', {
                    yPercent: 10,
                    rotate: 15,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut',
                    duration: 5,
                })
            }

            // 炭酸風 泡アニメーション
            if (!prefersReduced) {
                gsap.utils.toArray<HTMLElement>('.bubble').forEach((el) => {
                    const loop = () => {
                        gsap.set(el, {
                            yPercent: 0,
                            opacity: gsap.utils.random(0.5, 1),
                            xPercent: gsap.utils.random(-5, 5),
                        })
                        gsap.to(el, {
                            yPercent: -120,
                            opacity: 0,
                            scale: gsap.utils.random(1, 1.6),
                            duration: gsap.utils.random(1, 2), // 早めに消える
                            ease: 'sine.out',
                            delay: Math.random() * 1.2,
                            onComplete: loop,
                        })
                    }
                    loop()
                })
            }

            // 光の粒
            if (!prefersReduced) {
                gsap.utils.toArray<HTMLElement>('.sparkle').forEach((el) => {
                    const float = () => {
                        gsap.to(el, {
                            x: `+=${gsap.utils.random(-40, 40)}`,
                            y: `+=${gsap.utils.random(-40, 40)}`,
                            opacity: gsap.utils.random(0.3, 1),
                            scale: gsap.utils.random(0.5, 1.5),
                            duration: gsap.utils.random(3, 6),
                            ease: 'sine.inOut',
                            yoyo: true,
                            repeat: 1,
                            onComplete: float,
                        })
                    }
                    float()
                })
            }
        }, root)

        // クリック・マウス移動で泡を出す（炭酸仕様）
        const container = root.current
        let clickHandler: ((e: MouseEvent) => void) | null = null
        let moveHandler: ((e: MouseEvent) => void) | null = null

        if (container) {
            const createBubble = (x: number, y: number) => {
                const bubble = document.createElement('div')
                bubble.className = 'pointer-events-none absolute rounded-full bg-white/70 will-change-transform'
                const size = 2 + Math.random() * 6
                bubble.style.width = `${size}px`
                bubble.style.height = `${size}px`
                bubble.style.left = `${x - size / 2}px`
                bubble.style.top = `${y - size / 2}px`
                container.appendChild(bubble)

                gsap.fromTo(
                    bubble,
                    { y: 0, opacity: 1, scale: 0.8 },
                    {
                        y: -100,
                        opacity: 0,
                        scale: 1.6,
                        duration: 1 + Math.random(),
                        ease: 'sine.out',
                        onComplete: () => bubble.remove(),
                    }
                )
            }

            let lastMove = 0
            moveHandler = (e: MouseEvent) => {
                const now = Date.now()
                if (now - lastMove > 100) {
                    createBubble(e.clientX, e.clientY)
                    lastMove = now
                }
            }

            clickHandler = (e: MouseEvent) => createBubble(e.clientX, e.clientY)

            container.addEventListener('click', clickHandler)
            container.addEventListener('mousemove', moveHandler)
        }

        return () => {
            ctx.revert()
            if (container && clickHandler && moveHandler) {
                container.removeEventListener('click', clickHandler)
                container.removeEventListener('mousemove', moveHandler)
            }
        }
    }, [])

    useEffect(() => {
        if (!root.current) return
        const container = root.current

        const createAutoBubble = () => {
            const bubble = document.createElement('div')
            bubble.className = 'pointer-events-none absolute rounded-full bg-white/70 will-change-transform'
            const size = 2 + Math.random() * 6
            const left = Math.random() * container.clientWidth
            bubble.style.width = `${size}px`
            bubble.style.height = `${size}px`
            bubble.style.left = `${left}px`
            bubble.style.bottom = `0px`
            container.appendChild(bubble)

            gsap.fromTo(
                bubble,
                { y: 0, opacity: 1, scale: 0.8 },
                {
                    y: -window.innerHeight, // 画面上部まで流れる
                    opacity: 0,
                    scale: 1.6,
                    duration: 3 + Math.random() * 2, // 上まで届く時間を少し長めに
                    ease: 'sine.out',
                    onComplete: () => bubble.remove(),
                }
            )
        }

        // 頻度を高めて0.25秒ごとに泡を出す
        const interval = setInterval(createAutoBubble, 250)

        return () => clearInterval(interval)
    }, [])

    return (
        <div
            ref={root}
            className="relative h-[105vh] w-full overflow-hidden bg-gradient-to-b from-sky-900 via-blue-800 to-sky-700 text-white mb-14"
        >
            {/* 光のベール */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-white/5" />

            {/* 下部の白グラデーション（10vhに延長） */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[10vh] bg-gradient-to-b from-transparent to-white" />

            {/* コンテンツ中央 */}
            <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center">
                <h1 className="select-none font-bold tracking-wide text-5xl sm:text-6xl md:text-7xl lg:text-7xl drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
                    {chars.map((c, i) => (
                        <span key={`${c}-${i}`} className="char will-change-transform">
                            {c === ' ' ? '\u00A0' : c}
                        </span>
                    ))}
                </h1>

                <div className="underline mt-4 h-1 w-56 rounded-full bg-white/80 sm:w-64 md:w-80 will-change-transform" />

                <p className="mt-4 max-w-xl text-sm text-blue-100/90 sm:text-base">風祭小枝のブログへようこそ</p>
            </div>

            {/* ひし形 */}
            <div className="diamond pointer-events-none absolute left-10 top-16 h-10 w-10 rotate-45 rounded-md border border-white/40 bg-white/5 backdrop-blur-[1px] will-change-transform" />
            <div className="diamond pointer-events-none absolute right-12 top-24 h-6 w-6 rotate-45 rounded-md border border-white/30 bg-white/5 backdrop-blur-[1px] will-change-transform" />
            <div className="diamond pointer-events-none absolute left-1/4 top-1/3 h-8 w-8 rotate-45 rounded-md border border-white/30 bg-white/5 backdrop-blur-[1px] will-change-transform" />
            <div className="diamond pointer-events-none absolute right-1/4 top-1/2 h-5 w-5 rotate-45 rounded-md border border-white/20 bg-white/5 backdrop-blur-[1px] will-change-transform" />

            {/* 波 */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] overflow-hidden">
                <div
                    id="wave3"
                    className="wave absolute -left-1/2 bottom-0 h-48 w-[200%] rounded-[100%] bg-gradient-to-t from-sky-600/70 to-sky-400/20 blur-[2px] will-change-transform"
                />
                <div
                    id="wave2"
                    className="wave absolute -left-1/2 bottom-10 h-40 w-[200%] rounded-[100%] bg-gradient-to-t from-sky-500/75 to-sky-300/25 will-change-transform"
                />
                <div
                    id="wave1"
                    className="wave absolute -left-1/2 bottom-20 h-32 w-[200%] rounded-[100%] bg-gradient-to-t from-sky-400/80 to-sky-200/30 will-change-transform"
                />

                {/* 波の下のグラデーション */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white" />
            </div>

            {/* 泡 */}
            <div className="pointer-events-none absolute inset-0">
                {bubbles.map((b, i) => (
                    <div
                        key={i}
                        className="bubble absolute bottom-[-8%] rounded-full bg-white/70 blur-[0.2px] will-change-transform"
                        style={{
                            left: `${b.left}%`,
                            width: `${b.size}px`,
                            height: `${b.size}px`,
                        }}
                        data-delay={b.delay}
                    />
                ))}
            </div>
        </div>
    )
}
