'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollToTop() {
    const pathname = usePathname()

    useEffect(() => {
        // ページ遷移ごとにスクロール位置をリセットする
        window.scrollTo(0, 0)
    }, [pathname])

    return null
}
