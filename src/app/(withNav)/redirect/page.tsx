import React from 'react'
import RedirectPage from './RedirectPage'

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const params = await searchParams
    const raw = params?.to
    const to = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '')
    return <RedirectPage to={to} />
}
