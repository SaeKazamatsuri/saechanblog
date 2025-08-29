import useSWR from 'swr'

export type Range = { date?: string; from?: string; to?: string }

export type SummaryResponse = {
    range: Range
    total: number
    uniqueIps: number
    byStatus: Record<string, number>
    byMethod: Record<string, number>
    topPaths: { path: string; count: number }[]
}

export type TimeResponse = {
    range: Range
    items: { hour: string; count: number }[]
}

export type PathResponse = {
    range: Range
    totalPaths: number
    items: { path: string; count: number }[]
}

export type UaResponse = {
    range: Range
    byBrowser: { browser: string; count: number }[]
    byOS: { os: string; count: number }[]
    byDevice: { device: string; count: number }[]
    topUserAgents: { ua: string; count: number }[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function buildUrl(base: string, range: Range, extra?: Record<string, string | number>) {
    const p = new URLSearchParams()
    if (range.date) p.set('date', range.date)
    if (range.from) p.set('from', range.from)
    if (range.to) p.set('to', range.to)
    if (extra) Object.entries(extra).forEach(([k, v]) => p.set(k, String(v)))
    const s = p.toString()
    return s ? `${base}?${s}` : base
}

export function useSummary(range: Range) {
    return useSWR<SummaryResponse>(buildUrl('/api/analytics/summary', range), fetcher)
}

export function useTime(range: Range) {
    return useSWR<TimeResponse>(buildUrl('/api/analytics/time', range), fetcher)
}

export function usePath(range: Range, top: number) {
    return useSWR<PathResponse>(buildUrl('/api/analytics/path', range, { top }), fetcher)
}

export function useUa(range: Range) {
    return useSWR<UaResponse>(buildUrl('/api/analytics/ua', range), fetcher)
}
