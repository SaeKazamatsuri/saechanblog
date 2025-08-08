'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

// ログインページコンポーネント
export default function Page() {
	// 入力中のパスワード
	const [password, setPassword] = useState('')
	// 通信中フラグ
	const [loading, setLoading] = useState(false)
	// エラーメッセージ
	const [error, setError] = useState<string | null>(null)
	// 成功メッセージ
	const [okMessage, setOkMessage] = useState<string | null>(null)
	// ルーター
	const router = useRouter()

	// 送信処理
	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setOkMessage(null)
		setLoading(true)
		try {
			const res = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password }),
			})
			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				throw new Error(data?.error || 'Login failed')
			}
			setOkMessage('ログインしました')
			setPassword('')
			setTimeout(() => {
				router.push('/admin') // ログイン後に/adminへ遷移
			}, 400)
		} catch (err) {
			setError((err as Error).message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
			<div className="w-full max-w-sm">
				<h1 className="text-2xl font-semibold text-gray-900 mb-6 text-center">ログイン</h1>

				<form
					onSubmit={onSubmit}
					className="bg-white shadow-sm ring-1 ring-gray-200 rounded-lg p-6"
					aria-describedby={error ? 'form-error' : okMessage ? 'form-success' : undefined}
				>
					<div className="mb-4">
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							パスワード
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="current-password"
							required
							className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							placeholder="••••••••"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
						aria-busy={loading}
					>
						{loading ? '送信中...' : 'ログイン'}
					</button>

					{error && (
						<p
							id="form-error"
							className="mt-4 text-sm rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2"
						>
							{error}
						</p>
					)}

					{okMessage && (
						<p
							id="form-success"
							className="mt-4 text-sm rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2"
						>
							{okMessage}
						</p>
					)}
				</form>

				<p className="mt-4 text-center text-xs text-gray-500">
					パスワードは管理者から付与されたものを入力してください
				</p>
			</div>
		</main>
	)
}
