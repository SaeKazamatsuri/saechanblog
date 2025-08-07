'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function KazamatsuriLogin() {
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const res = await fetch('/api/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password }),
		});

		if (res.ok) {
			router.push('/admin');
		} else {
			setError('パスワードが違います');
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<h1>風祭ログイン</h1>
			<input
				type="password"
				placeholder="パスワード"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
			/>
			<button type="submit">ログイン</button>
			{error && <p style={{ color: 'red' }}>{error}</p>}
		</form>
	);
}
