import React, { useMemo } from 'react'
import { useTime, TimeResponse } from './useApi'
import { TimeLine } from './charts/TimeLine'

type Props = { range: { date?: string; from?: string; to?: string } }

export function TimePanel({ range }: Props) {
    const { data, isLoading } = useTime(range)
    const items = (data?.items ?? []) as TimeResponse['items']
    const labels = useMemo(() => items.map((x) => x.hour), [items])
    const counts = useMemo(() => items.map((x) => Number(x.count)), [items])
    if (isLoading) return <div className="text-gray-500">Loading...</div>
    return (
        <div className="rounded-lg border p-4">
            <div className="text-sm text-gray-600 mb-2">Requests per Hour (JST)</div>
            <TimeLine labels={labels} data={counts} />
        </div>
    )
}
