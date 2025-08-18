// page.tsx
import Link from 'next/link'

// Page component to center two navigation buttons
export default function Page() {
    return (
        <main className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Link to create new page */}
                <Link
                    href="./admin/new"
                    className="px-12 py-6 rounded border text-base font-medium text-white bg-black hover:opacity-90 transition"
                >
                    新規作成
                </Link>
                {/* Link to edit/delete page */}
                <Link
                    href="./admin/edit"
                    className="px-12 py-6 rounded border text-base font-medium text-white bg-black hover:opacity-90 transition"
                >
                    編集・削除
                </Link>
            </div>
        </main>
    )
}
