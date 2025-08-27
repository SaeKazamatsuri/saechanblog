'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ExternalLinkGuard() {
    const pathname = usePathname()
    useEffect(() => {
        const host = window.location.host
        const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))
        for (const a of anchors) {
            if (a.dataset.skipRedirect === 'true') continue
            const raw = a.getAttribute('href') || ''
            if (!raw) continue
            if (raw.startsWith('#')) continue
            if (raw.startsWith('/redirect')) continue
            if (raw.startsWith('/')) continue
            if (raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) continue
            let u: URL
            try {
                u = new URL(raw, window.location.href)
            } catch {
                continue
            }
            if (u.protocol !== 'http:' && u.protocol !== 'https:') continue
            if (u.host === host) continue
            const to = `/redirect?to=${encodeURIComponent(u.toString())}`
            a.setAttribute('href', to)
            a.setAttribute('rel', 'noopener noreferrer')
        }
    }, [pathname])
    return null
}
