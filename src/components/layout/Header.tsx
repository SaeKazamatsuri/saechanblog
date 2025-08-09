import path from 'path'; // 1行コメント: パス操作
import fs from 'fs'; // 1行コメント: ファイル操作
import Link from 'next/link'; // 1行コメント: ルーティング
import HeaderNav from './HeaderNav'; // 1行コメント: クライアントナビ

// 1行コメント: カテゴリ型
type Category = {
	displayName: string;
	slug: string;
};

// 1行コメント: カテゴリ取得
const getCategories = (): Category[] => {
	const postsDirectory = path.join(process.cwd(), 'public/post'); // 1行コメント: 投稿ルート
	return fs
		.readdirSync(postsDirectory, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => {
			const m = dirent.name.match(/^\[(.+?)\]\((.+?)\)$/); // 1行コメント: [表示名](slug) 形式
			if (!m) {
				return { displayName: dirent.name, slug: encodeURIComponent(dirent.name) };
			}
			const [, displayName, slug] = m;
			return { displayName, slug };
		});
};

export default function Header() {
	const categories = getCategories(); // 1行コメント: カテゴリ配列
	return (
		<header className="relative z-50 bg-gray-800 text-white">
			{/* 1行コメント: 大見出しはPCのみ */}
			<div className="hidden lg:block px-4 pt-6 pb-2">
				<h1 className="text-center text-4xl font-bold tracking-wide pb-2">
					<Link href="/">ショートランドのこかげ</Link>
				</h1>
			</div>

			{/* 1行コメント: ナビ本体 */}
			<HeaderNav categories={categories} siteName="ショートランドのこかげ" />
		</header>
	);
}
