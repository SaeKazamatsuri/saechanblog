'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { usePathname } from 'next/navigation'

type Category = {
    displayName: string
    slug: string
}

type Props = {
    categories: Category[]
}

export default function HeaderNav({ categories }: Props) {
    const [mounted, setMounted] = useState(false)
    const [open, setOpen] = useState(false)
    const [openCat, setOpenCat] = useState(false)
    const [openAbout, setOpenAbout] = useState(false)
    const [navClosing, setNavClosing] = useState(false)
    const menuRef = useRef<HTMLElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const pathname = usePathname()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const menu = menuRef.current
        if (!menu) return
        if (open) {
            menu.removeAttribute('inert')
            menu.setAttribute('aria-hidden', 'false')
            const first = menu.querySelector<HTMLElement>('a,button,[tabindex]:not([tabindex="-1"])')
            first?.focus()
            document.body.style.overflow = 'hidden'
        } else {
            if (menu.contains(document.activeElement)) {
                ;(document.activeElement as HTMLElement | null)?.blur()
            }
            menu.setAttribute('inert', '')
            menu.setAttribute('aria-hidden', 'true')
            triggerRef.current?.focus()
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [open])

    const closeAll = () => {
        setOpen(false)
        setOpenCat(false)
        setOpenAbout(false)
    }

    const handleDesktopLinkClick = () => {
        setNavClosing(true)
    }

    useEffect(() => {
        if (!mounted) return
        setNavClosing(false)
        closeAll()
    }, [pathname, mounted])

    return (
        <nav className="px-4">
            <div className="lg:hidden flex items-center justify-between h-14">
                <div className="min-w-0 flex-1 pr-2 flex items-center">
                    <Link href="/" className="inline-block max-w-full h-full">
                        <span className="inline-flex items-center h-full text-lg font-semibold leading-none truncate">
                            ショートランドのこかげ
                        </span>
                    </Link>
                </div>

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

            <ul className="hidden lg:flex items-center justify-center space-x-8 text-base h-12">
                <li>
                    <Link href="/" className="flex items-center h-12 px-4 hover:text-gray-300">
                        ホーム
                    </Link>
                </li>

                <li className="relative group">
                    <Link
                        href="/post"
                        className="flex items-center h-12 px-4 hover:text-gray-300 gap-1"
                        onClick={handleDesktopLinkClick}
                    >
                        ブログ
                        {mounted ? <Icon icon="mdi:chevron-down" width="18" height="18" /> : null}
                    </Link>
                    <ul
                        className={`absolute left-0 top-full min-w-max bg-gray-800 shadow-lg z-20 space-y-1 ${
                            navClosing ? '!hidden' : 'hidden group-hover:block hover:block'
                        }`}
                    >
                        {categories.map((cat) => (
                            <li key={cat.slug}>
                                <Link
                                    href={`/post/${cat.slug}`}
                                    className="block whitespace-nowrap px-6 py-3 text-base hover:bg-gray-700"
                                    onClick={handleDesktopLinkClick}
                                >
                                    {cat.displayName}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </li>

                <li className="relative group">
                    <Link
                        href="/about"
                        className="flex items-center h-12 px-4 hover:text-gray-300 gap-1"
                        onClick={handleDesktopLinkClick}
                    >
                        サイトについて
                        {mounted ? <Icon icon="mdi:chevron-down" width="18" height="18" /> : null}
                    </Link>
                    <ul
                        className={`absolute left-0 top-full min-w-max bg-gray-800 shadow-lg z-20 space-y-1 ${
                            navClosing ? '!hidden' : 'hidden group-hover:block hover:block'
                        }`}
                    >
                        {[
                            { label: '運営者について', href: '/charge-of-this-site' },
                            { label: 'サイトマップ', href: '/site-map' },
                            { label: 'プライバシーポリシー', href: '/privacy-policy' },
                        ].map((link) => (
                            <li key={link.label}>
                                <Link
                                    href={link.href}
                                    className="block whitespace-nowrap px-6 py-3 text-base hover:bg-gray-700"
                                    onClick={handleDesktopLinkClick}
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

            {mounted
                ? createPortal(
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
                              className={`fixed top-0 left-0 z-50 h-screen w-4/5 max-w-sm bg-gray-900 text-white shadow-xl transition-transform duration-200 ${
                                  open ? 'translate-x-0' : '-translate-x-full'
                              }`}
                              role="dialog"
                              aria-modal="true"
                          >
                              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
                                  <span className="text-lg font-semibold">メニュー</span>
                                  <button
                                      type="button"
                                      aria-label="メニューを閉じる"
                                      onClick={closeAll}
                                      className="p-2"
                                  >
                                      <Icon icon="mdi:close" width="24" height="24" />
                                  </button>
                              </div>

                              <div className="px-2 py-2">
                                  <Link
                                      href="/"
                                      className="block px-3 py-3 rounded hover:bg-gray-800"
                                      onClick={closeAll}
                                  >
                                      ホーム
                                  </Link>

                                  <button
                                      type="button"
                                      className="w-full flex items-center justify-between px-3 py-3 rounded hover:bg-gray-800"
                                      aria-expanded={openCat}
                                      onClick={() => setOpenCat((v) => !v)}
                                  >
                                      <span>ブログ</span>
                                      <Icon
                                          icon={openCat ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                                          width="20"
                                          height="20"
                                      />
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
                                      <span>サイト情報</span>
                                      <Icon
                                          icon={openAbout ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                                          width="20"
                                          height="20"
                                      />
                                  </button>
                                  <div
                                      className={`${openAbout ? 'max-h-96' : 'max-h-0'} overflow-hidden transition-[max-height] duration-200`}
                                  >
                                      <div className="pl-3">
                                          {[
                                              { label: 'サイトについて', href: '/about' },
                                              { label: '運営者について', href: '/charge-of-this-site' },
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
                      </>,
                      document.body
                  )
                : null}
        </nav>
    )
}
