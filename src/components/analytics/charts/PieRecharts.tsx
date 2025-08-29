import React from 'react'
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend } from 'recharts'

type Props = { data: { name: string; value: number }[] }

export function PieRecharts({ data }: Props) {
    return (
        <div className="w-full h-[360px]">
            <ResponsiveContainer>
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" outerRadius={120} />
                    <Tooltip />
                    <Legend />
                    {data.map((_, i) => (
                        <Cell key={i} />
                    ))}
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
