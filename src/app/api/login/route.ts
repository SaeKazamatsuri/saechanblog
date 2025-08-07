
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
	const { password } = await req.json();

	if (password === process.env.ADMIN_PASSWORD) {
		(await cookies()).set({
			name: 'admin_auth',
			value: 'true',
			path: '/',
			maxAge: 60 * 60,
			httpOnly: false,
		});

		return NextResponse.json({ success: true }, { status: 200 });
	}

	return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
}
