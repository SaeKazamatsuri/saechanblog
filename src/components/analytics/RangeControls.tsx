import React from 'react'

type Props = {
    mode: 'date' | 'range'
    setMode: (m: 'date' | 'range') => void
    date: string
    setDate: (v: string) => void
    from: string
    setFrom: (v: string) => void
    to: string
    setTo: (v: string) => void
}

export function RangeControls({ mode, setMode, date, setDate, from, setFrom, to, setTo }: Props) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex gap-2">
                <button
                    onClick={() => setMode('date')}
                    className={`px-3 py-2 rounded border ${mode === 'date' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
                >
                    Date
                </button>
                <button
                    onClick={() => setMode('range')}
                    className={`px-3 py-2 rounded border ${mode === 'range' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
                >
                    Range
                </button>
            </div>
            {mode === 'date' && (
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border rounded px-3 py-2"
                    />
                </div>
            )}
            {mode === 'range' && (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">From</label>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="border rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">To</label>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="border rounded px-3 py-2"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
