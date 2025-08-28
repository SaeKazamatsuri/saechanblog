import React from 'react'
import RedirectPage from './RedirectPage'

export default function Page({ searchParams }: { searchParams: { to?: string } }) {
    const to = typeof searchParams.to === 'string' ? searchParams.to : ''
    return <RedirectPage to={to} />
}
