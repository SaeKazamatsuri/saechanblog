'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'

export type Heading = {
    id: string
    text: string
    level: 2 | 3
}

type Props = { headings: Heading[] }

export default function TableOfContents({ headings }: Props) {
    // アクティブ見出しの初期値を先頭idにして初回の空状態を避ける
    const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '')
    // 「トップへ戻る」を出すかどうか（PC/モバイル共通条件）
    const [showTopButton, setShowTopButton] = useState(false)
    // SSR/CSRの不一致回避のため、マウント後にだけIconを描画する
    const [mounted, setMounted] = useState(false)
    // scroll/observerの両方から一貫して現在のアクティブを持つ
    const prevActiveRef = useRef(activeId)

    useEffect(() => {
        setMounted(true) // クライアントマウント後のみIconを出す
    }, [])

    useEffect(() => {
        // スクロール位置で端の補正とトップボタン制御
        const handleScroll = () => {
            const scrolled = window.scrollY
            setShowTopButton(scrolled > 100)
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
        // 画面内の最上位見出しをアクティブ化
        if (!headings.length) return

        const handleIntersect: IntersectionObserverCallback = (entries) => {
            const inView = entries
                .filter((e) => e.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

            let next = prevActiveRef.current
            if (inView.length) next = inView[0].target.id

            if (next !== prevActiveRef.current) {
                prevActiveRef.current = next
                setActiveId(next)
            }
        }

        const observer = new IntersectionObserver(handleIntersect, {
            rootMargin: '0px 0px -70% 0px',
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

    const scrollToTop = (e?: React.MouseEvent) => {
        if (e) e.preventDefault()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        prevActiveRef.current = headings[0]?.id ?? ''
        setActiveId(headings[0]?.id ?? '')
    }

    return (
        <>
            <nav aria-label="Table of contents">
                {/* PC向けの「トップへ戻る」パネル */}
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
                        {headings.map((h) => {
                            const isActive = activeId === h.id
                            const indent = h.level === 3 ? 'pl-10' : 'pl-8'
                            const dotColor = isActive ? 'after:bg-blue-900' : 'after:bg-blue-700'
                            const dotSize = isActive ? 'after:w-3 after:h-3' : 'after:w-2 after:h-2'
                            return (
                                <li
                                    key={h.id}
                                    className={[
                                        'relative',
                                        indent,
                                        'first:pt-2',
                                        'last:pb-2',
                                        isActive ? 'py-3' : '',
                                        "before:content-['']",
                                        'before:absolute',
                                        'before:left-3',
                                        'before:w-px',
                                        'before:bg-blue-700/80',
                                        'before:top-[-2px]',
                                        'before:bottom-[-2px]',
                                        'first:before:top-1/2',
                                        'last:before:bottom-1/2',
                                        "after:content-['']",
                                        'after:absolute',
                                        'after:left-3',
                                        'after:top-1/2',
                                        'after:-translate-x-1/2',
                                        'after:-translate-y-1/2',
                                        'after:rounded-full',
                                        dotSize,
                                        dotColor,
                                    ].join(' ')}
                                >
                                    <a
                                        href={`#${h.id}`}
                                        onClick={handleClick(h.id)}
                                        aria-current={isActive ? 'true' : undefined}
                                        className={[
                                            'block',
                                            'transition-colors',
                                            isActive
                                                ? 'text-sm text-blue-800 font-bold'
                                                : 'text-sm text-blue-600 hover:text-blue-700',
                                        ].join(' ')}
                                    >
                                        {h.text}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </nav>

            {/* モバイル(lg未満)の右下丸ボタン。Iconはmounted後のみ描画 */}
            <button
                type="button"
                aria-label="トップへ戻る"
                onClick={scrollToTop}
                className={[
                    'fixed',
                    'bottom-4',
                    'right-4',
                    'z-50',
                    'w-12',
                    'h-12',
                    'rounded-full',
                    'bg-white',
                    'shadow-lg',
                    'border',
                    'border-blue-100',
                    'flex',
                    'items-center',
                    'justify-center',
                    'transition-all',
                    'duration-300',
                    'lg:hidden',
                    showTopButton
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-0 pointer-events-none',
                ].join(' ')}
            >
                {mounted ? <Icon icon="mdi:arrow-up" width="24" height="24" className="text-blue-600" /> : null}
            </button>
        </>
    )
}
