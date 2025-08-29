import React from 'react'

type Tab = { key: string; label: string }
type Props = { tabs: Tab[]; activeKey: string; onChange: (key: string) => void }

export function Tabs({ tabs, activeKey, onChange }: Props) {
    return (
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap gap-2" aria-label="Tabs">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => onChange(t.key)}
                        className={`px-3 py-2 text-sm font-medium border-b-2 ${
                            activeKey === t.key
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </nav>
        </div>
    )
}
