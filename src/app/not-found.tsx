import Link from "next/link"

export default function NotFound() {
	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
			<h1 className="text-4xl font-bold text-gray-800 mb-4">404 - ページが見つかりません</h1>
			<p className="text-gray-600 mb-6">お探しのページは存在しないようです。</p>
			<Link
				href="/"
				className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
			>
				ホームへ戻る
			</Link>
		</main>
	)
}
