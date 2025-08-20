import Header from './Header'
import Footer from './Footer'

type MainLayoutProps = {
    children: React.ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />

            <main className="flex-1">
                <div>{children}</div>
            </main>

            <Footer />
        </div>
    )
}

export default MainLayout
