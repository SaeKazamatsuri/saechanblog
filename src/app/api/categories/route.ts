// src/app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/posts';

export async function GET() {
	// ファイル操作はサーバー側なので即同期読みでも OK
	const categories = getCategories();
	return NextResponse.json(categories);
}
