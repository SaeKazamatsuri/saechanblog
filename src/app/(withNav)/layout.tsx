import MainLayout from '@/components/layout/MainLayout'
import IrisOverlay from '@/components/layout/IrisOverlay'
import ExternalLinkGuard from '@/components/layout/ExternalLinkGuard'

export default function WithNavLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="">
            <MainLayout>{children}</MainLayout>
            <IrisOverlay />
            <ExternalLinkGuard />
        </div>
    )
}
