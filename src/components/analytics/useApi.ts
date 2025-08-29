import useSWR from 'swr'

export type Range = { date?: string; from?: string; to?: string }

function qs(range: Range) {
    const p = new URLSearchParams()
    if (range.date) p.set('date', range.date)
    if (range.from) p.set('from', range.from)
    if (range.to) p.set('to', range.to)
    const s = p.toString()
    return s ? `?${s}` : ''
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useSummary(range: Range) {
    return useSWR(`/api/analytics/summary${qs(range)}`, fetcher)
}

export function useTime(range: Range) {
    return useSWR(`/api/analytics/time${qs(range)}`, fetcher)
}

export function usePath(range: Range, top: number) {
    return useSWR(`/api/analytics/path${qs(range)}${qsAppend({ top: String(top) })}`, fetcher)
}

export function useUa(range: Range) {
    return useSWR(`/api/analytics/ua${qs(range)}`, fetcher)
}

function qsAppend(extra: Record<string, string>) {
    const p = new URLSearchParams()
    Object.entries(extra).forEach(([k, v]) => p.set(k, v))
    const s = p.toString()
    return s ? (qs({}) ? `&${s}` : `?${s}`) : ''
}
