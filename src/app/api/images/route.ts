import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const category = searchParams.get('category')?.trim() || '';

	// public/post 直下をまず走査
	const postRoot = path.join(process.cwd(), 'public', 'post');

	try {
		// ① postRoot にある全ディレクトリを列挙
		const entries = await readdir(postRoot, { withFileTypes: true });

		// ② 「(...slug)」で終わるフォルダ名を探す
		//    category = 'hobby' なら "[趣味](hobby)" が該当
		const regexp = new RegExp(`\\(${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)$`, 'i');
		const targetDir = entries.find((e) => e.isDirectory() && regexp.test(e.name));

		if (!targetDir) {
			// 見つからなければ空配列で返す
			return NextResponse.json({ images: [] });
		}

		// ③ 見つかったディレクトリ内のファイルを再列挙
		const dirPath = path.join(postRoot, targetDir.name);
		const files = await readdir(dirPath, { withFileTypes: true });

		const images = files
			.filter((f) => f.isFile() && /\.(png|jpe?g|gif|webp|avif)$/i.test(f.name))
			.map((f) => f.name);

		return NextResponse.json({ images, folder: targetDir.name });
	} catch {
		// 何かしら失敗した場合
		return NextResponse.json({ images: [] });
	}
}
