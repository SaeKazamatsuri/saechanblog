import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

type Item = { path: string; count: number }
type Props = { data: Item[] }

export function PathsBar({ data }: Props) {
    return (
        <div className="w-full h-[420px]">
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="path" tick={{ fontSize: 10 }} interval={0} height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
