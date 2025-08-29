import React from 'react'
import { Bar } from 'react-chartjs-2'
import 'chart.js/auto'

type Props = { labels: string[]; data: number[] }

export function MethodBar({ labels, data }: Props) {
    return (
        <Bar
            data={{
                labels,
                datasets: [{ label: 'Requests', data }],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
        />
    )
}
