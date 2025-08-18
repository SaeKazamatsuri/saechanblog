// 機能: 管理画面(新規投稿) サーバーラッパー
import { getCategories } from '@/lib/posts' // 変数: カテゴリ取得
import AdminPageClient from './AdminPageClient' // 変数: クライアント本体

export const revalidate = 0 // 変数: 常に最新

export default async function Page() {
    const initialCategories = getCategories() // 変数: 初期カテゴリ一覧
    return <AdminPageClient initialCategories={initialCategories} />
}
