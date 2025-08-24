'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image from 'next/image'

gsap.registerPlugin(ScrollTrigger)

const WhatShortland = () => {
    const sectionRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!sectionRef.current) return
        const ctx = gsap.context(() => {
            const triggerEl = sectionRef.current as HTMLDivElement

            // 見出しと本文テキストを順にフェードアップ（SNSと同じ流れ）。1回だけ発火
            const textEls = triggerEl.querySelectorAll<HTMLElement>('.fade-up h2, .fade-up p')
            const items = triggerEl.querySelectorAll<HTMLElement>('.fade-up.grid > div')

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: triggerEl,
                    start: 'top 50%',
                    toggleActions: 'play none none none',
                    once: true,
                },
            })

            if (textEls.length) {
                tl.from(textEls, { opacity: 0, y: 10, duration: 0.5, ease: 'power2.out', stagger: 0.15 })
            }
            if (items.length) {
                tl.from(items, { opacity: 0, y: 18, duration: 0.6, ease: 'power2.out', stagger: 0.12 }, '-=0.1')
            }
        }, sectionRef)
        return () => ctx.revert()
    }, [])

    type Book = {
        id: string
        src: string
        alt: string
        dlsiteUrl: string
        boothUrl: string
    }

    const books: Book[] = [
        {
            id: 'c105',
            src: '/image/book/c105.webp',
            alt: '読ん棚 vol.1',
            dlsiteUrl: 'https://www.dlsite.com/home/work/=/product_id/RJ01453957.html',
            boothUrl: 'https://koeda-sl.booth.pm/items/6430592',
        },
        {
            id: 'c106',
            src: '/image/book/c106.webp',
            alt: '読ん棚 vol.2',
            dlsiteUrl: 'https://www.dlsite.com/home/work/=/product_id/RJ01453973.html',
            boothUrl: 'https://koeda-sl.booth.pm/items/7322350',
        },
    ]

    return (
        <section
            ref={sectionRef}
            className="relative flex flex-col items-center min-h-[80vh] overflow-hidden bg-gradient-to-b from-sky-700 via-sky-200 to-gray-50 text-center px-6"
        >
            {/* グラデーションはセクションのTailwind背景を維持。SVGは装飾ラインのみ */}
            <svg
                className="bg-parallax pointer-events-none absolute inset-0 w-full h-full"
                viewBox="0 0 1000 600"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
            >
                <defs>
                    {/* ラインをやわらかく光らせる */}
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* うねるライン */}
                <g filter="url(#glow)" opacity="0.9">
                    <path
                        className="draw-line"
                        d="M-50,180 C150,100 350,260 550,180 C720,110 870,200 1050,160"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        className="draw-line"
                        d="M-50,300 C120,380 360,240 560,320 C760,400 920,320 1050,360"
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        className="draw-line"
                        d="M-50,440 C140,500 320,420 520,470 C740,530 900,470 1050,520"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </g>
            </svg>

            <div className="fade-up mb-16 md:mb-32">
                <h2 className="text-3xl md:text-6xl font-bold text-white mb-8 md:mb-4">
                    <span className="block md:inline">「ショートランドの</span>
                    <span className="block md:inline">こかげ」とは</span>
                </h2>
                <p className="text-[clamp(1vw,1.5rem,6vw)] text-white leading-relaxed">
                    <span className="block md:inline">同人誌管理システム</span>
                    <span className="block md:inline">「読ん棚」</span>
                    <span className="block md:inline">を開発しているサークルです。</span>
                </p>
            </div>

            <div className="fade-up mb-3 md:mb-6">
                <h2 className="text-3xl md:text-6xl font-bold text-white mb-4">読ん棚シリーズ</h2>
                <p className="text-[clamp(1vw,1.5rem,6vw)] text-white leading-relaxed">DLsite・BOOTHにて頒布中！</p>
            </div>

            <div className="relative mb-32">
                <div className="fade-up grid grid-cols-2 gap-2 sm:gap-8 w-full">
                    {books.map((book) => (
                        <div key={book.id} className="flex flex-col items-center mx-auto">
                            <div className="relative mb-3 sm:mb-6 w-[35vw] md:w-[30vw] lg:w-[20vw] aspect-[3/4]">
                                <Image
                                    src={book.src}
                                    alt={book.alt}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover rounded-lg shadow-lg"
                                />
                            </div>
                            <div className="grid grid-cols-1 w-[35vw] md:w-[30vw] lg:w-[20vw] md:grid-cols-2 gap-2 sm:gap-4">
                                <a
                                    href={book.dlsiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-center text-white rounded-md p-3 text-sm sm:text-lg font-semibold transition duration-200 bg-[#052a83] hover:bg-sky-700"
                                >
                                    DLsite
                                </a>
                                <a
                                    href={book.boothUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-center text-white rounded-md p-3 text-sm sm:text-lg font-semibold transition duration-200 bg-[#fd5257] hover:bg-red-600"
                                >
                                    BOOTH
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default WhatShortland
