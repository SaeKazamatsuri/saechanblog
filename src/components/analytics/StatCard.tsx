import React from 'react'

type Props = { title: string; value: string | number }

export function StatCard({ title, value }: Props) {
    return (
        <div className="rounded-lg border p-4">
            <div className="text-sm text-gray-500">{title}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
    )
}
