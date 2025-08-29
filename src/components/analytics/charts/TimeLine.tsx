import React from 'react'
import { Line } from 'react-chartjs-2'
import 'chart.js/auto'

type Props = { labels: string[]; data: number[] }

export function TimeLine({ labels, data }: Props) {
    return (
        <Line
            data={{
                labels,
                datasets: [{ label: 'Requests', data, tension: 0.3 }],
            }}
            options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { autoSkip: true, maxTicksLimit: 12 } } },
            }}
        />
    )
}
