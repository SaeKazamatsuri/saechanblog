import React, { useMemo, useState } from 'react'
import { usePath } from './useApi'
import { PathsBar } from './charts/PathsBar'

type Props = { range: { date?: string; from?: string; to?: string } }

export function PathPanel({ range }: Props) {
    const [top, setTop] = useState(20)
    const { data, isLoading } = usePath(range, top)
    const items = useMemo(() => data?.items || [], [data])
    if (isLoading) return <div className="text-gray-500">Loading...</div>
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Top</label>
                <input
                    type="number"
                    min={1}
                    max={100}
                    value={top}
                    onChange={(e) => setTop(Number(e.target.value))}
                    className="border rounded px-3 py-2 w-28"
                />
            </div>
            <div className="rounded-lg border p-4">
                <div className="text-sm text-gray-600 mb-2">Top Paths</div>
                <PathsBar data={items} />
            </div>
            <div className="rounded-lg border p-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-500">
                            <th className="py-2 pr-4">Path</th>
                            <th className="py-2">Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((x: any) => (
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
