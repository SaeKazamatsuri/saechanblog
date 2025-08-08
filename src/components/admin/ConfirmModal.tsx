'use client'

import { useCallback, useState } from 'react'

// 機能: モーダル型の確認ダイアログ＋Promiseで結果を返す

type ConfirmOptions = {
	title?: string
	confirmText?: string
	cancelText?: string
}

type State = {
	open: boolean
	message: string
	options: ConfirmOptions
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	resolver: ((v: boolean) => void) | null
}

export function useConfirm() {
	// 状態: モーダルの開閉とメッセージ
	const [state, setState] = useState<State>({
		open: false,
		message: '',
		options: {},
		resolver: null,
	})

	// 機能: confirmを表示して結果をPromiseで返す
	const confirm = useCallback((message: string, options: ConfirmOptions = {}) => {
		return new Promise<boolean>(resolve => {
			setState({ open: true, message, options, resolver: resolve })
		})
	}, [])

	// 機能: 確定
	const handleOk = useCallback(() => {
		state.resolver?.(true)
		setState(s => ({ ...s, open: false, resolver: null }))
	}, [state.resolver])

	// 機能: 取消
	const handleCancel = useCallback(() => {
		state.resolver?.(false)
		setState(s => ({ ...s, open: false, resolver: null }))
	}, [state.resolver])

	// 機能: 実体コンポーネント
	const ConfirmDialog = () => {
		if (!state.open) return null
		const { message, options } = state
		const title = options.title ?? '確認'
		const okText = options.confirmText ?? 'OK'
		const cancelText = options.cancelText ?? 'キャンセル'
		return (
			<div
				className="fixed inset-0 z-50 flex items-center justify-center"
				aria-modal="true"
				role="dialog"
			>
				<div
					className="absolute inset-0 bg-black/40"
					onClick={handleCancel}
				/>
				<div className="relative w-[90%] max-w-md rounded-sm bg-white shadow-lg border border-gray-200">
					<div className="px-4 py-3 border-b border-gray-200">
						<h2 className="text-base font-semibold text-gray-900">{title}</h2>
					</div>
					<div className="px-4 py-4 text-gray-800 whitespace-pre-wrap">
						{message}
					</div>
					<div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
						<button
							onClick={handleCancel}
							className="h-[36px] px-3 rounded-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
						>
							{cancelText}
						</button>
						<button
							onClick={handleOk}
							className="h-[36px] px-3 rounded-sm bg-blue-600 text-white hover:bg-blue-700"
						>
							{okText}
						</button>
					</div>
				</div>
			</div>
		)
	}

	return { confirm, ConfirmDialog }
}
