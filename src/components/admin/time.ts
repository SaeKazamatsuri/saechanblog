'use client'

// 機能: JST関連ユーティリティ
export const getJst = () => {
    // JSTはUTC+9
    const JST_OFFSET_MIN = -9 * 60
    const diff = (JST_OFFSET_MIN - new Date().getTimezoneOffset()) * 6e4
    return new Date(Date.now() + diff)
}

const pad = (n: number) => String(n).padStart(2, '0')

export const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const fmtTimestamp = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
