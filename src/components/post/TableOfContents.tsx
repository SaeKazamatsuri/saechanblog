'use client'

import { useEffect, useRef, useState } from 'react'

export type Heading = {
    id: string
    text: string
    level: 2 | 3
}

type Props = { headings: Heading[] }

export default function TableOfContents({ headings }: Props) {
    const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '')
    const [showTopButton, setShowTopButton] = useState(false) // スクロール量に応じて「トップへ戻る」を表示
    const prevActiveRef = useRef(activeId)

    useEffect(() => {
        const handleScroll = () => {
            // スクロール量でトップボタン表示制御
            const scrolled = window.scrollY
            setShowTopButton(scrolled > 100)

            // 端の補正: 一番上と一番下では確定で先頭/末尾をアクティブにする
            if (!headings.length) return
            const atTop = scrolled === 0
            const atBottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight

            let next: string | null = null
            if (atBottom) next = headings[headings.length - 1].id
            else if (atTop) next = headings[0].id

            if (next && next !== prevActiveRef.current) {
                prevActiveRef.current = next
                setActiveId(next)
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [headings])

    useEffect(() => {
        // 可視範囲の見出しを監視して最上位のものをアクティブにする
        if (!headings.length) return

        const handleIntersect: IntersectionObserverCallback = (entries) => {
            // 画面内に入っている見出しを上方向の順に並べる
            const inView = entries
                .filter((e) => e.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

            let next = prevActiveRef.current

            // 端の補正はスクロールイベント側で実施するため、ここでは画面内の最上位に限定
            if (inView.length) next = inView[0].target.id

            if (next !== prevActiveRef.current) {
                prevActiveRef.current = next
                setActiveId(next)
            }
        }

        const observer = new IntersectionObserver(handleIntersect, {
            rootMargin: '0px 0px -70% 0px', // 画面上部寄りでアクティブが切り替わるように余白調整
            threshold: 0,
        })

        const els: HTMLElement[] = []
        headings.forEach(({ id }) => {
            const el = document.getElementById(id)
            if (el) {
                observer.observe(el)
                els.push(el)
            }
        })

        return () => {
            els.forEach((el) => observer.unobserve(el))
            observer.disconnect()
        }
    }, [headings])

    const handleClick = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        const el = document.getElementById(id)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            prevActiveRef.current = id
            setActiveId(id)
        }
    }

    const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        prevActiveRef.current = headings[0]?.id ?? ''
        setActiveId(headings[0]?.id ?? '')
    }

    return (
        <nav aria-label="Table of contents">
            {/* トップへ戻るボタンの表示はそのまま。見た目は変更しない */}
            <div
                className={`overflow-hidden transition-all duration-500 ${
                    showTopButton ? 'max-h-20 opacity-100 translate-x-0 mb-3' : 'max-h-0 opacity-0 translate-x-20'
                }`}
            >
                <div className="bg-white p-6 rounded-xl shadow-sm transform transition-all duration-500">
                    <a
                        href="#top"
                        onClick={scrollToTop}
                        className="block font-semibold text-xl text-blue-800 hover:text-blue-700 transition-colors"
                    >
                        トップへ戻る
                    </a>
                </div>
            </div>

            {/* もくじ本体の見た目も変更しない */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <p className="mb-2 font-semibold text-xl text-blue-800">もくじ</p>
                <hr className="my-2 border-b-1 border-blue-200/80" />
                <ul className="mb-4 space-y-1">
                    {headings.map((h) => (
                        <li key={h.id} className={h.level === 3 ? 'pl-4' : ''}>
                            <a
                                href={`#${h.id}`}
                                onClick={handleClick(h.id)}
                                className={`block text-sm transition-colors ${
                                    activeId === h.id ? 'text-blue-800 font-bold' : 'text-blue-600 hover:text-blue-700'
                                }`}
                            >
                                {h.text}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    )
}
