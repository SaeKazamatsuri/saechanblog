'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import Toast from './Toast';

type ToastItem = { id: number; message: string; duration?: number };
type ToastContextValue = {
	/** 新しいトーストを表示する */
	pushToast: (message: string, duration?: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/** <ToastProvider> でラップすると、子コンポーネントは pushToast を使える */
export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	/** 先頭に追加 → 新しい通知が一番上に並ぶ */
	const pushToast = useCallback((message: string, duration?: number) => {
		setToasts((prev) => [{ id: Date.now(), message, duration }, ...prev]);
	}, []);

	/** 個別トーストが消えたら配列から除去 */
	const removeToast = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<ToastContext.Provider value={{ pushToast }}>
			{children}

			{/* トーストをまとめて描画 */}
			<div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
				{toasts.map((t) => (
					<Toast
						key={t.id}
						message={t.message}
						duration={t.duration}
						onClose={() => removeToast(t.id)}
					/>
				))}
			</div>
		</ToastContext.Provider>
	);
}

/** どこからでも呼べるカスタムフック */
export function useToast(): (message: string, duration?: number) => void {
	const ctx = useContext(ToastContext);
	if (!ctx) {
		throw new Error('useToast は <ToastProvider> の内側で使ってね');
	}
	return ctx.pushToast;
}
