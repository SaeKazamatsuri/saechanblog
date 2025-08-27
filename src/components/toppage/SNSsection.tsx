'use client'

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Icon } from '@iconify/react'
import Image from 'next/image'

gsap.registerPlugin(ScrollTrigger)

type IconId = 'x' | 'github' | 'booth' | 'dlsite' | 'circlems' | 'pixiv'
type SnsItem = { id: IconId; name: string; href: string; icon?: string; imgSrc?: string }

const DEFAULT_ITEMS: SnsItem[] = [
    { id: 'x', name: 'X', href: 'https://x.com/SaeKazamatsuri', icon: 'pajamas:twitter' },
    { id: 'github', name: 'GitHub', href: 'https://github.com/SaeKazamatsuri', icon: 'mdi:github' },
    { id: 'booth', name: 'BOOTH', href: 'https://koeda-sl.booth.pm/', imgSrc: '/image/sns/booth.png' },
    {
        id: 'dlsite',
        name: 'DLsite',
        href: 'https://www.dlsite.com/home/circle/profile/=/maker_id/RG01053949.html',
        imgSrc: '/image/sns/dlsite.png',
    },
    {
        id: 'circlems',
        name: 'Circle.ms',
        href: 'https://portal.circle.ms/Circle/Index/10479435',
        imgSrc: '/image/sns/circle.png',
    },
    { id: 'pixiv', name: 'pixiv', href: 'https://www.pixiv.net/users/26617526', icon: 'simple-icons:pixiv' },
]

type Props = {
    items?: SnsItem[]
    title?: string // 見出しテキスト。未指定なら「各種リンク」
    grayBg?: boolean // 背景をgray-50にするか。未指定ならtrue
    useAnimation?: boolean // GSAPアニメーションを使うか。未指定ならtrue
}

const ICON_SIZE = 64
const TILE_SIZE = 96

const SNSsection: React.FC<Props> = ({
    items = DEFAULT_ITEMS,
    title = '各種リンク',
    grayBg = true,
    useAnimation = true,
}) => {
    const sectionRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (!useAnimation) return
        if (!sectionRef.current) return

        const titleEl = sectionRef.current.querySelector<HTMLElement>('#sns-heading')
        const nodes = sectionRef.current.querySelectorAll<HTMLElement>('[data-sns-item]')
        if (!titleEl && !nodes.length) return

        const tl = gsap.timeline({
            scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', toggleActions: 'play none none none' },
        })

        if (titleEl) tl.from(titleEl, { opacity: 0, y: 18, duration: 0.6, ease: 'power2.out' })
        if (nodes.length)
            tl.from(nodes, { opacity: 0, y: 18, stagger: 0.12, duration: 0.6, ease: 'power2.out' }, '-=0.1')

        return () => {
            tl.kill()
            if (tl.scrollTrigger) tl.scrollTrigger.kill()
        }
    }, [useAnimation])

    const renderVisual = (item: SnsItem) => {
        if (item.imgSrc) {
            return (
                <Image
                    src={item.imgSrc}
                    alt=""
                    width={ICON_SIZE}
                    height={ICON_SIZE}
                    sizes={`${ICON_SIZE}px`}
                    aria-hidden="true"
                    className="object-contain"
                    style={{ width: ICON_SIZE, height: ICON_SIZE }}
                />
            )
        }
        if (item.icon) return <Icon icon={item.icon} width={ICON_SIZE} height={ICON_SIZE} aria-hidden="true" />
        return <Icon icon="mdi:image-off-outline" width={ICON_SIZE} height={ICON_SIZE} aria-hidden="true" />
    }

    return (
        <section
            ref={sectionRef}
            className={`min-h-[30vh] ${grayBg ? 'bg-gray-50' : 'bg-transparent'} flex items-center justify-center`}
            aria-labelledby="sns-heading"
        >
            <div className="max-w-4xl w-full px-6">
                <h2 id="sns-heading" className="text-[clamp(20px,4vw,48px)] font-bold text-black text-center mb-4">
                    {title}
                </h2>
                <ul className="flex flex-wrap gap-6 justify-center items-center">
                    {items.map((item) => (
                        <li key={item.id}>
                            <a
                                data-sns-item
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={item.name}
                                className="group flex flex-col items-center gap-2 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                            >
                                <div
                                    className="flex items-center justify-center rounded-lg border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow"
                                    style={{ width: TILE_SIZE, height: TILE_SIZE }}
                                >
                                    {renderVisual(item)}
                                </div>
                                <span className="text-sm text-gray-600 group-hover:text-gray-900">{item.name}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

export default SNSsection
