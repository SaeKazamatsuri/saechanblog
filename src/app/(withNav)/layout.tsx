import MainLayout from '@/components/layout/MainLayout'
import IrisOverlay from '@/components/layout/IrisOverlay'

export default function WithNavLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="">
            <MainLayout>{children}</MainLayout>
            <IrisOverlay />
        </div>
    )
}
