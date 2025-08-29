import React, { useMemo } from 'react'
import { StatCard } from './StatCard'
import { useSummary, SummaryResponse } from './useApi'
import { StatusDoughnut } from './charts/StatusDoughnut'
import { MethodBar } from './charts/MethodBar'

type Props = { range: { date?: string; from?: string; to?: string } }

export function SummaryPanel({ range }: Props) {
    const { data, isLoading } = useSummary(range)

    const statusData = useMemo(() => {
        const src = (data?.byStatus ?? {}) as SummaryResponse['byStatus']
        const entries = Object.entries(src)
        return {
            labels: entries.map(([k]) => k),
            counts: entries.map(([, v]) => Number(v)),
        }
    }, [data])

    const methodData = useMemo(() => {
        const src = (data?.byMethod ?? {}) as SummaryResponse['byMethod']
        const entries = Object.entries(src)
        return {
            labels: entries.map(([k]) => k),
            counts: entries.map(([, v]) => Number(v)),
        }
    }, [data])

    if (isLoading) return <div className="text-gray-500">Loading...</div>

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total" value={data?.total ?? 0} />
                <StatCard title="Unique IPs" value={data?.uniqueIps ?? 0} />
                <StatCard title="Top Paths" value={data?.topPaths?.length ?? 0} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-lg border p-4">
                    <div className="text-sm text-gray-600 mb-2">Status</div>
                    <StatusDoughnut labels={statusData.labels} data={statusData.counts} />
                </div>
                <div className="rounded-lg border p-4">
                    <div className="text-sm text-gray-600 mb-2">Method</div>
                    <MethodBar labels={methodData.labels} data={methodData.counts} />
                </div>
            </div>
            <div className="rounded-lg border p-4 overflow-x-auto">
                <div className="text-sm text-gray-600 mb-2">Top Paths</div>
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-500">
                            <th className="py-2 pr-4">Path</th>
                            <th className="py-2">Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data?.topPaths ?? []).map((x) => (
                            <tr key={x.path} className="border-t">
                                <td className="py-2 pr-4 font-mono">{x.path}</td>
                                <td className="py-2">{x.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
