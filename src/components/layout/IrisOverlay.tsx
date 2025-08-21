'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import gsap from 'gsap'
import Image from 'next/image'

export default function IrisOverlay() {
    const overlayRef = useRef<HTMLDivElement>(null)
    const imgWrapRef = useRef<HTMLDivElement>(null)
    const coverWhiteRef = useRef<HTMLDivElement>(null)
    const coverSkyRef = useRef<HTMLDivElement>(null)
    const coverBlueRef = useRef<HTMLDivElement>(null)

    const router = useRouter()
    const pathname = usePathname()
    const firstLoadDoneRef = useRef(false)
    const transitionStartTimeRef = useRef<number | null>(null)
    const [enabled] = useState(true)

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

    useEffect(() => {
        gsap.set([coverWhiteRef.current, coverSkyRef.current, coverBlueRef.current], { autoAlpha: 0 })
        gsap.set(imgWrapRef.current, { autoAlpha: 0, scale: 1 })
    }, [])

    useEffect(() => {
        if (!enabled) return
        const overlay = overlayRef.current
        const imgWrap = imgWrapRef.current
        const covers = [coverWhiteRef.current, coverSkyRef.current, coverBlueRef.current]
        if (!overlay || !imgWrap || covers.some((c) => !c)) return

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

            gsap.set('.root', { autoAlpha: 0 })

            gsap.set(overlay, { display: 'block' })
            covers.forEach((c) => gsap.set(c, { autoAlpha: 0, clipPath: makeDiamondPolygon(0) }))
            gsap.set(imgWrap, { autoAlpha: 0, scale: 0.92 })

            const tlOut = gsap.timeline({ defaults: { ease: 'power3.inOut' } })
            tlOut.to(imgWrap, { autoAlpha: 1, scale: 1, duration: 0.45 }, 0)

            covers.forEach((c, i) => {
                tlOut.to(
                    c,
                    { autoAlpha: 1, clipPath: makeDiamondPolygon(100), duration: 0.6 },
                    i * 0.13 // 少しずつずらして重なり感
                )
            })

            tlOut.add(() => {
                router.push(url.pathname + url.search + url.hash)
            })
        }

        document.addEventListener('click', onClick)
        return () => document.removeEventListener('click', onClick)
    }, [enabled, router, pathname])

    useEffect(() => {
        const overlay = overlayRef.current
        const imgWrap = imgWrapRef.current
        const covers = [coverWhiteRef.current, coverSkyRef.current, coverBlueRef.current]
        if (!overlay || !imgWrap || covers.some((c) => !c)) return

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
            gsap.set(overlay, { display: 'block' })
            covers.forEach((c) => gsap.set(c, { autoAlpha: 1, clipPath: makeDiamondPolygon(100) }))
            gsap.set(imgWrap, { autoAlpha: 1, scale: 1.0 })
            gsap.set('.root', { autoAlpha: 1 })

            const tlIn = gsap.timeline({
                defaults: { ease: 'power3.inOut' },
                onComplete: () => {
                    gsap.set(overlay, { display: 'none' })
                    gsap.set(imgWrap, { autoAlpha: 0, scale: 1 })
                    transitionStartTimeRef.current = null
                },
            })

            tlIn.to(imgWrap, { autoAlpha: 0, scale: 0.96, duration: 0.6 }, 0.05)

            covers.forEach((c, i) => {
                tlIn.to(c, { clipPath: makeDiamondPolygon(0), duration: 0.6 }, i * 0.05)
                tlIn.to(c, { autoAlpha: 0, duration: 0.12 }, '-=0.05')
            })
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
                willChange: 'opacity, transform',
                backfaceVisibility: 'hidden',
            }}
        >
            <div
                ref={coverWhiteRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#ffffff',
                    willChange: 'clip-path, opacity',
                    backfaceVisibility: 'hidden',
                    contain: 'layout paint style size',
                }}
                aria-hidden
            />
            <div
                ref={coverSkyRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#0369a1',
                    willChange: 'clip-path, opacity',
                    backfaceVisibility: 'hidden',
                    contain: 'layout paint style size',
                }}
                aria-hidden
            />
            <div
                ref={coverBlueRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#1e40af',
                    willChange: 'clip-path, opacity',
                    backfaceVisibility: 'hidden',
                    contain: 'layout paint style size',
                }}
                aria-hidden
            />

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
