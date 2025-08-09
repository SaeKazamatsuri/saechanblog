import { notFound } from 'next/navigation' // 404遷移用
import { getSortedPostsData, getCategories, type Category as LibCategory } from '@/lib/posts' // 投稿・カテゴリ取得
import PostList from '@/components/post/PostList' // 一覧描画
import type { Metadata } from 'next' // メタデータ型

type Category = LibCategory // カテゴリ型
type Props = { params: Promise<{ category: string }> } // ルートパラメータはPromise

export const revalidate = 60 // ISR間隔（秒）

export async function generateStaticParams() { // 静的生成パラメータ
	const categories = getCategories() // 全カテゴリ
	return categories.map((c) => ({ category: c.slug })) // パス一覧
}

export async function generateMetadata({ params }: Props): Promise<Metadata> { // 動的メタデータ生成
	const { category: categorySlug } = await params // カテゴリスラッグはawaitで取得
	const categories = getCategories() // 全カテゴリ
	const category = categories.find((c) => c.slug === categorySlug) // 対象カテゴリ

	if (!category) {
		return {
			title: 'カテゴリが見つかりません', // 404用タイトル
			description: '指定されたカテゴリは存在しません', // 404用説明
		}
	}

	return {
		title: `${category.displayName}カテゴリの投稿`, // タイトル
		description: `ショートランドのこかげ(sae-chan.net)の${category.displayName}カテゴリの投稿`, // 説明
	}
}

export default async function Page({ params }: Props) { // カテゴリページ本体
	const { category: categorySlug } = await params // ルートパラメータはawaitで取得

	const categories = getCategories() // 全カテゴリ
	const category = categories.find((c) => c.slug === categorySlug) // 対象カテゴリ
	if (!category) notFound() // 未登録スラッグの404

	const allPosts = getSortedPostsData() // 全投稿データ
	const filtered = allPosts.filter((p) => p.categorySlug === categorySlug) // 抽出

	const heading = `${category.displayName}カテゴリの投稿` // 見出し

	return (
		<PostList
			posts={filtered}
			heading={heading}
			emptyMessage="このカテゴリの投稿はまだありません"
		/>
	)
}
