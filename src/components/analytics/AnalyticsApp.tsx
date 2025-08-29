'use client'

import React, { useMemo, useState } from 'react'
import { Tabs } from './Tabs'
import { RangeControls } from './RangeControls'
import { SummaryPanel } from './SummaryPanel'
import { TimePanel } from './TimePanel'
import { PathPanel } from './PathPanel'
import { UaPanel } from './UaPanel'

export type Range = { date?: string; from?: string; to?: string }

function todayJST() {
    const d = new Date()
    return new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
}

function ymd(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const da = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${da}`
}

export function AnalyticsApp() {
    const [active, setActive] = useState<'summary' | 'time' | 'path' | 'ua'>('summary')
    const [mode, setMode] = useState<'date' | 'range'>('date')
    const [date, setDate] = useState(ymd(todayJST()))
    const [from, setFrom] = useState(ymd(todayJST()))
    const [to, setTo] = useState(ymd(todayJST()))
    const range = useMemo<Range>(() => {
        if (mode === 'date') return { date }
        return { from, to }
    }, [mode, date, from, to])

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Analytics</h1>
            <RangeControls
                mode={mode}
                setMode={setMode}
                date={date}
                setDate={setDate}
                from={from}
                setFrom={setFrom}
                to={to}
                setTo={setTo}
            />
            <Tabs
                tabs={[
                    { key: 'summary', label: 'Summary' },
                    { key: 'time', label: 'Time' },
                    { key: 'path', label: 'Path' },
                    { key: 'ua', label: 'UA' },
                ]}
                activeKey={active}
                onChange={(k) => setActive(k as any)}
            />
            {active === 'summary' && <SummaryPanel range={range} />}
            {active === 'time' && <TimePanel range={range} />}
            {active === 'path' && <PathPanel range={range} />}
            {active === 'ua' && <UaPanel range={range} />}
        </div>
    )
}
