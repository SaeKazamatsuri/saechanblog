import MainLayout from '@/components/layout/MainLayout'

export default function WithNavLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="">
            <MainLayout>{children}</MainLayout>
        </div>
    )
}
