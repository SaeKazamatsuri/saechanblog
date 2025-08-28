import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: '外部ページに遷移',
}

export default function RedirectLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
