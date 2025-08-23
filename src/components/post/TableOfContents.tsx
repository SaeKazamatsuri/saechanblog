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
    const [showTopButton, setShowTopButton] = useState(false) // スクロールで表示切替
    const prevActiveRef = useRef(activeId)

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY
            // 100px以上スクロールしたら表示
            setShowTopButton(scrolled > 100)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

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
            {/* トップへ戻るボタン */}
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

            {/* もくじ本体 */}
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
