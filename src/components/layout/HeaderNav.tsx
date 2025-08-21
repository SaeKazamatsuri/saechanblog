'use client'

import { useEffect, useRef, useState } from 'react' // マウント検知と開閉状態
import Link from 'next/link' // ルーティング
import { Icon } from '@iconify/react' // アイコン

// カテゴリ型
type Category = {
    displayName: string
    slug: string
}

// 受け取りProps
type Props = {
    categories: Category[]
    siteName: string
}

export default function HeaderNav({ categories, siteName }: Props) {
    const [mounted, setMounted] = useState(false) // ハイドレーション対策
    const [open, setOpen] = useState(false) // モバイルメニュー開閉
    const [openCat, setOpenCat] = useState(false) // カテゴリ開閉
    const [openAbout, setOpenAbout] = useState(false) // サイトについて開閉
    const menuRef = useRef<HTMLElement>(null) // メニュー要素参照
    const triggerRef = useRef<HTMLButtonElement>(null) // トグルボタン参照

    useEffect(() => {
        setMounted(true) // クライアントマウント後にtrue
    }, [])

    useEffect(() => {
        const menu = menuRef.current // inert/aria-hidden制御対象
        if (!menu) return
        if (open) {
            menu.removeAttribute('inert') // 開く時はフォーカス可能に
            menu.setAttribute('aria-hidden', 'false') // SRに可視
            const first = menu.querySelector<HTMLElement>('a,button,[tabindex]:not([tabindex="-1"])') // 初期フォーカス先
            first?.focus() // メニューオープン時に内部へフォーカス移動
            document.body.style.overflow = 'hidden' // 背景スクロール固定
        } else {
            // 閉じる前に内部フォーカスを外す
            if (menu.contains(document.activeElement)) {
                ;(document.activeElement as HTMLElement | null)?.blur()
            }
            menu.setAttribute('inert', '') // 閉じている間はフォーカス不能
            menu.setAttribute('aria-hidden', 'true') // SRにも非表示
            triggerRef.current?.focus() // フォーカスをトグルボタンへ返す
            document.body.style.overflow = '' // 背景スクロール解除
        }
        return () => {
            document.body.style.overflow = '' // クリーンアップ
        }
    }, [open])

    const closeAll = () => {
        setOpen(false) // メニューを閉じる
        setOpenCat(false) // カテゴリ閉
        setOpenAbout(false) // サイトについて閉
    }

    return (
        <nav className="px-4">
            {/* スマホ〜タブレット用トップバー（横並び） */}
            <div className="lg:hidden flex items-center justify-between h-14">
                <Link href="/" className="min-w-0 flex-1 pr-2">
                    <span className="block text-lg font-semibold leading-none truncate">{siteName}</span>
                </Link>
                <button
                    ref={triggerRef}
                    type="button"
                    aria-label="メニューを開く"
                    aria-expanded={open}
                    aria-controls="mobile-menu"
                    onClick={() => setOpen(true)}
                    className="p-3"
                >
                    {mounted ? <Icon icon="mdi:menu" width="28" height="28" /> : null}
                </button>
            </div>

            {/* PCナビ（高さ統一で縦ズレ解消） */}
            <ul className="hidden lg:flex items-center justify-center space-x-8 text-base h-12">
                <li>
                    <Link href="/" className="flex items-center h-12 px-4 hover:text-gray-300">
                        ホーム
                    </Link>
                </li>

                <li className="relative group">
                    <Link href="/post" className="flex items-center h-12 px-4 hover:text-gray-300 gap-1">
                        カテゴリ
                        {mounted ? <Icon icon="mdi:chevron-down" width="18" height="18" /> : null}
                    </Link>
                    <ul className="absolute left-0 top-full hidden min-w-max bg-gray-800 shadow-lg z-20 group-hover:block hover:block space-y-1">
                        {categories.map((cat) => (
                            <li key={cat.slug}>
                                <Link
                                    href={`/post/${cat.slug}`}
                                    className="block whitespace-nowrap px-6 py-3 text-base hover:bg-gray-700"
                                >
                                    {cat.displayName}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </li>

                <li className="relative group">
                    <Link href="/about" className="flex items-center h-12 px-4 hover:text-gray-300 gap-1">
                        サイトについて
                        {mounted ? <Icon icon="mdi:chevron-down" width="18" height="18" /> : null}
                    </Link>
                    <ul className="absolute left-0 top-full hidden min-w-max bg-gray-800 shadow-lg z-20 group-hover:block hover:block space-y-1">
                        {[
                            { label: 'サイト運営について', href: '/charge-of-this-site' },
                            { label: 'サイトマップ', href: '/site-map' },
                            { label: 'プライバシーポリシー', href: '/privacy-policy' },
                        ].map((link) => (
                            <li key={link.label}>
                                <Link
                                    href={link.href}
                                    className="block whitespace-nowrap px-6 py-3 text-base hover:bg-gray-700"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </li>

                <li>
                    <Link href="/contact" className="flex items-center h-12 px-4 hover:text-gray-300">
                        お問い合わせ
                    </Link>
                </li>
            </ul>

            {/* モバイルメニュー（マウント後だけ描画してHydration防止） */}
            {mounted ? (
                <>
                    <div
                        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 ${
                            open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                        onClick={closeAll}
                    />
                    <aside
                        ref={menuRef}
                        id="mobile-menu"
                        className={`fixed top-0 left-0 z-50 h-screen w-4/5 max-w-sm bg-gray-900 shadow-xl transition-transform duration-200 ${
                            open ? 'translate-x-0' : '-translate-x-full'
                        }`}
                        role="dialog" // モーダル的意味付け
                        aria-modal="true" // 背景はモーダル外
                    >
                        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
                            <span className="text-lg font-semibold">メニュー</span>
                            <button type="button" aria-label="メニューを閉じる" onClick={closeAll} className="p-2">
                                <Icon icon="mdi:close" width="24" height="24" />
                            </button>
                        </div>

                        <div className="px-2 py-2">
                            <Link href="/" className="block px-3 py-3 rounded hover:bg-gray-800" onClick={closeAll}>
                                ホーム
                            </Link>

                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-3 py-3 rounded hover:bg-gray-800"
                                aria-expanded={openCat}
                                onClick={() => setOpenCat((v) => !v)}
                            >
                                <span>カテゴリ</span>
                                <Icon icon={openCat ? 'mdi:chevron-up' : 'mdi:chevron-down'} width="20" height="20" />
                            </button>
                            <div
                                className={`${openCat ? 'max-h-96' : 'max-h-0'} overflow-hidden transition-[max-height] duration-200`}
                            >
                                <div className="pl-3">
                                    <Link
                                        href="/post"
                                        className="block px-3 py-2 rounded hover:bg-gray-800"
                                        onClick={closeAll}
                                    >
                                        一覧へ
                                    </Link>
                                    {categories.map((cat) => (
                                        <Link
                                            key={cat.slug}
                                            href={`/post/${cat.slug}`}
                                            className="block px-3 py-2 rounded hover:bg-gray-800"
                                            onClick={closeAll}
                                        >
                                            {cat.displayName}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-3 py-3 rounded hover:bg-gray-800"
                                aria-expanded={openAbout}
                                onClick={() => setOpenAbout((v) => !v)}
                            >
                                <span>サイトについて</span>
                                <Icon icon={openAbout ? 'mdi:chevron-up' : 'mdi:chevron-down'} width="20" height="20" />
                            </button>
                            <div
                                className={`${openAbout ? 'max-h-96' : 'max-h-0'} overflow-hidden transition-[max-height] duration-200`}
                            >
                                <div className="pl-3">
                                    {[
                                        { label: 'サイト運営について', href: '/charge-of-this-site' },
                                        { label: 'サイトマップ', href: '/site-map' },
                                        { label: 'プライバシーポリシー', href: '/privacy-policy' },
                                    ].map((link) => (
                                        <Link
                                            key={link.label}
                                            href={link.href}
                                            className="block px-3 py-2 rounded hover:bg-gray-800"
                                            onClick={closeAll}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <Link
                                href="/contact"
                                className="block px-3 py-3 rounded hover:bg-gray-800"
                                onClick={closeAll}
                            >
                                お問い合わせ
                            </Link>
                        </div>
                    </aside>
                </>
            ) : null}
        </nav>
    )
}
