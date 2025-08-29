import React from 'react'
import { useUa, UaResponse } from './useApi'
import { PieRecharts } from './charts/PieRecharts'

type Props = { range: { date?: string; from?: string; to?: string } }

export function UaPanel({ range }: Props) {
    const { data, isLoading } = useUa(range)
    const byBrowser = (data?.byBrowser ?? []) as UaResponse['byBrowser']
    const byOS = (data?.byOS ?? []) as UaResponse['byOS']
    const topUserAgents = (data?.topUserAgents ?? []) as UaResponse['topUserAgents']
    if (isLoading) return <div className="text-gray-500">Loading...</div>
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-lg border p-4">
                <div className="text-sm text-gray-600 mb-2">Browser</div>
                <PieRecharts data={byBrowser.map((x) => ({ name: x.browser, value: Number(x.count) }))} />
            </div>
            <div className="rounded-lg border p-4">
                <div className="text-sm text-gray-600 mb-2">OS</div>
                <PieRecharts data={byOS.map((x) => ({ name: x.os, value: Number(x.count) }))} />
            </div>
            <div className="rounded-lg border p-4 overflow-x-auto">
                <div className="text-sm text-gray-600 mb-2">Top User Agents</div>
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-500">
                            <th className="py-2 pr-4">UA</th>
                            <th className="py-2">Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topUserAgents.map((x) => (
                            <tr key={x.ua} className="border-t">
                                <td className="py-2 pr-4">{x.ua}</td>
                                <td className="py-2">{x.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
