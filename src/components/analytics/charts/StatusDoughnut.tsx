import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import 'chart.js/auto'

type Props = { labels: string[]; data: number[] }

export function StatusDoughnut({ labels, data }: Props) {
    return (
        <Doughnut
            data={{
                labels,
                datasets: [{ data }],
            }}
            options={{
                responsive: true,
                plugins: { legend: { position: 'bottom' } },
            }}
        />
    )
}
