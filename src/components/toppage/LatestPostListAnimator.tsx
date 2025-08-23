// app/components/LatestPostListAnimator.tsx
'use client'

import { useEffect, useRef } from 'react'

type Props = {
    targetId: string
    itemCount: number
}

export default function LatestPostListAnimator({ targetId, itemCount }: Props) {
    // gsapの型は動的import運用に合わせてanyで保持
    const tlRef = useRef<any>(null)

    useEffect(() => {
        let mounted = true

        ;(async () => {
            // SSR対策としてクライアントでのみ読み込む
            const { gsap } = await import('gsap')
            const { ScrollTrigger } = await import('gsap/ScrollTrigger')
            gsap.registerPlugin(ScrollTrigger)

            if (!mounted) return
            const section = document.getElementById(targetId)
            if (!section) return

            // Serverが描画した見出しとul>liを対象にする
            const title = section.querySelector('h2')
            const nodes = Array.from(section.querySelectorAll('ul > li'))

            // スクロールインで見出し→カード群の順にフェード
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top 50%',
                    toggleActions: 'play none none none',
                },
            })

            if (title) tl.from(title, { opacity: 0, y: 10, duration: 0.5, ease: 'power2.out' })
            if (nodes.length)
                tl.from(nodes, { opacity: 0, y: 18, stagger: 0.12, duration: 0.6, ease: 'power2.out' }, '-=0.1')

            tlRef.current = tl
        })()

        return () => {
            mounted = false
            // 自コンポーネント起因のタイムラインと同一triggerのScrollTriggerのみ破棄
            try {
                tlRef.current?.kill()
                tlRef.current = null
                ;(async () => {
                    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
                    const section = document.getElementById(targetId)
                    if (!section) return
                    ScrollTrigger.getAll().forEach((st) => {
                        if (st.trigger === section) st.kill()
                    })
                })()
            } catch {}
        }
    }, [targetId, itemCount])

    return null
}
