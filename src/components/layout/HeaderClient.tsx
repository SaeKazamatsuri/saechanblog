// src/components/layout/HeaderClient.tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import HeaderNav from './HeaderNav'
import { Category } from '@/lib/getCategories'

export default function HeaderClient({ categories }: { categories: Category[] }) {
    const [visible, setVisible] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        if (pathname !== '/') {
            // ルート以外ではヘッダーを常に表示
            setVisible(true)
            return
        }

        // トップページのみスクロール監視で表示制御
        const handleScroll = () => {
            setVisible(window.scrollY > window.innerHeight - 400)
        }

        // ページ遷移直後はスクロール位置が0なので必ず非表示からスタート
        setVisible(false)
        window.addEventListener('scroll', handleScroll)

        return () => window.removeEventListener('scroll', handleScroll)
    }, [pathname])

    return (
        <header
            className={`
                ${pathname === '/' ? 'fixed' : 'static'} 
                top-0 z-50 w-full bg-gray-800 text-white 
                ${pathname === '/' ? 'transition-all duration-700 ease-out' : ''}
                ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
                ${pathname !== '/' ? 'mb-5' : ''}
            `}
        >
            <div className="hidden lg:block px-4 pt-6 pb-2">
                <h1 className="text-center text-4xl font-bold tracking-wide pb-2">
                    <Link href="/">ショートランドのこかげ</Link>
                </h1>
            </div>
            <HeaderNav categories={categories} siteName="ショートランドのこかげ" />
        </header>
    )
}
