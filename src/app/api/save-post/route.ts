// src/app/api/save-post/route.ts
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getCategoryDirName } from '@/lib/posts';

export async function POST(req: NextRequest) {
	try {
		const { content, category: slug, filename, overwrite = false } = await req.json();

		if (!content || !slug || !filename) {
			return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
		}

		const dirName = getCategoryDirName(slug) ?? `[${slug}](${slug})`;
		const filePath = path.join(process.cwd(), 'public', 'post', dirName, `${filename}.md`);

		// ファイルが存在 & overwrite=false のときは 409 を返す
		if (!overwrite && existsSync(filePath)) {
			return NextResponse.json({ error: 'File exists' }, { status: 409 });
		}

		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, content, 'utf8');

		return NextResponse.json({ ok: true });
	} catch (err) {
		console.error(err);
		return NextResponse.json({ error: 'Server Error' }, { status: 500 });
	}
}
