'use client'

import { useEffect, useMemo, useState } from 'react'

type Preview = {
    href: string
    title: string
    description: string
    image?: string
    siteName?: string
    hostname: string
    error?: string
}

export function LinkCard({ href }: { href: string }) {
    const [data, setData] = useState<Preview | null>(null)
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)

    const { destHref, target, rel } = useMemo(() => {
        let dest = href
        let tgt: '_blank' | '_self' | undefined = undefined
        let r: string | undefined = undefined
        try {
            if (href.startsWith('#')) return { destHref: dest, target: tgt, rel: r }
            if (href.startsWith('/redirect')) return { destHref: dest, target: tgt, rel: r }
            if (href.startsWith('/')) return { destHref: dest, target: tgt, rel: r }
            if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
                return { destHref: dest, target: tgt, rel: r }
            }
            const u = new URL(href, typeof window !== 'undefined' ? window.location.href : undefined)
            const isHttp = u.protocol === 'http:' || u.protocol === 'https:'
            const isExternal = typeof window !== 'undefined' ? isHttp && u.host !== window.location.host : isHttp
            if (isExternal) {
                dest = `/redirect?to=${encodeURIComponent(u.toString())}`
                tgt = '_blank'
                r = 'noopener noreferrer'
            }
            return { destHref: dest, target: tgt, rel: r }
        } catch {
            return { destHref: dest, target: tgt, rel: r }
        }
    }, [href])

    useEffect(() => {
        let aborted = false
        setLoading(true)
        setFailed(false)
        fetch(`/api/link-preview?url=${encodeURIComponent(href)}`, { cache: 'no-store' })
            .then((r) => r.json())
            .then((d: Preview) => {
                if (aborted) return
                if (d.error) setFailed(true)
                else setData({ ...d, href })
            })
            .catch(() => setFailed(true))
            .finally(() => {
                if (!aborted) setLoading(false)
            })
        return () => {
            aborted = true
        }
    }, [href])

    if (loading) {
        return (
            <div className="flex md:max-w-2/3 gap-3 my-5 p-3 mx-auto border rounded-lg shadow-sm bg-white/70 animate-pulse">
                <div className="w-28 h-28 shrink-0 rounded-md bg-gray-200" />
                <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-gray-200 rounded" />
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                    <div className="h-4 w-1/3 bg-gray-200 rounded" />
                </div>
            </div>
        )
    }

    if (failed || !data) {
        return (
            <a
                href={destHref}
                target={target}
                rel={rel}
                className="block md:max-w-2/3 gap-3 my-5 p-3 mx-auto border rounded-lg shadow-sm hover:shadow transition bg-white"
            >
                <div className="text-blue-700 underline truncate">{href}</div>
            </a>
        )
    }

    return (
        <a
            href={destHref}
            target={target}
            rel={rel}
            className="flex md:max-w-2/3 gap-3 my-5 p-3 mx-auto border rounded-lg shadow-sm hover:shadow-md transition bg-white"
        >
            {data.image ? (
                <img
                    src={data.image}
                    alt=""
                    className="hidden md:block w-auto h-28 object-cover rounded-md border bg-gray-50 shrink-0"
                    loading="lazy"
                />
            ) : (
                <div className="w-28 h-28 rounded-md border bg-gray-50 shrink-0 flex items-center justify-center text-xs text-gray-500">
                    {data.hostname}
                </div>
            )}
            <div className="min-w-0 basis-0 flex-1">
                <div className="text-base font-semibold leading-snug line-clamp-2 break-words">
                    {data.title || href}
                </div>
                {data.description ? (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2 break-words">{data.description}</p>
                ) : null}
                <div className="mt-2 text-xs text-gray-500 truncate">{data.siteName || data.hostname}</div>
            </div>
        </a>
    )
}
