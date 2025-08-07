'use client';

import { useEffect, useState } from 'react';

type Props = {
	message: string;
	/** ミリ秒。既定 3 秒 */
	duration?: number;
	onClose: () => void;
};

/** 単体トースト（右上に表示・右からフェードイン→フェードアウト） */
export default function Toast({ message, duration = 3000, onClose }: Props) {
	const [visible, setVisible] = useState(false);
	const TRANSITION_MS = 300;

	// ---------------- フェードイン ----------------
	useEffect(() => {
		const id = requestAnimationFrame(() => setVisible(true));
		return () => cancelAnimationFrame(id);
	}, []);

	// ---------------- フェードアウト ----------------
	useEffect(() => {
		const id = setTimeout(() => setVisible(false), duration);
		return () => clearTimeout(id);
	}, [duration]);

	// ---------------- 完了通知 ----------------
	useEffect(() => {
		if (!visible) {
			const id = setTimeout(onClose, TRANSITION_MS);
			return () => clearTimeout(id);
		}
	}, [visible, onClose]);

	return (
		<div
			role="status"
			className={`
        pointer-events-auto
        w-80 max-w-full rounded-lg bg-green-600 px-6 py-4 text-base text-white shadow-lg
        transition ease-out duration-300             /* ← ここをまとめた */
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
      `}
		>
			{message}
		</div>
	);
}
