// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
	const cookie = req.cookies.get('admin_auth');

	if (req.nextUrl.pathname.startsWith('/admin')) {
		if (cookie?.value !== 'true') {
			const redirectUrl = req.nextUrl.clone();
			redirectUrl.pathname = '/';
			return NextResponse.redirect(redirectUrl);
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/admin'],
};
