'use client';

import { useState } from 'react';
import { useToast } from '@/components/admin/ToastProvider'; // ★ 追加

type Props = {
	category: string; // 例: 'hobby'
	label?: string;
};

export default function ImageGalleryModal({ category, label = '画像を見る' }: Props) {
	const [open, setOpen] = useState(false);
	const [images, setImages] = useState<string[]>([]);
	const [folder, setFolder] = useState<string>('');

	const pushToast = useToast(); // ★ コンテキストから取得

	/* 一覧取得 */
	const handleOpen = async () => {
		setOpen(true);
		try {
			const res = await fetch(`/api/images?category=${encodeURIComponent(category)}`);
			const data: { images: string[]; folder: string } = await res.json();
			setImages(data.images);
			setFolder(data.folder);
		} catch {
			setImages([]);
			setFolder('');
			pushToast('画像の取得に失敗しました');
		}
	};

	const handleClose = () => {
		setOpen(false);
		setImages([]);
		setFolder('');
	};

	/* クリック → Markdown 形式でコピーしてトースト表示 */
	const copyToClipboard = async (fileName: string) => {
		const markdown = `![](/${fileName})`;
		try {
			await navigator.clipboard.writeText(markdown);
			pushToast('コピーしました');
		} catch {
			pushToast('コピーできませんでした');
		}
	};

	return (
		<>
			{/* トリガーボタン */}
			<button
				onClick={handleOpen}
				className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			>
				{label}
			</button>

			{/* モーダル */}
			{open && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
					onClick={handleClose}
				>
					<div
						className="max-h-[90vh] w-[90vw] overflow-y-auto rounded bg-white p-6"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mb-4 flex justify-between">
							<h2 className="text-xl font-bold">{folder || category} の画像</h2>
							<button onClick={handleClose} className="text-gray-500 hover:text-gray-800">
								×
							</button>
						</div>

						{images.length === 0 ? (
							<p className="text-center text-gray-500">画像が見つかりませんでした。</p>
						) : (
							<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
								{images.map((name) => (
									<button
										key={name}
										onClick={() => copyToClipboard(name)}
										className="focus:outline-none"
									>
										<img
											src={`/post/${encodeURIComponent(folder)}/${encodeURIComponent(name)}`}
											alt={name}
											className="h-40 w-full object-cover"
										/>
										<span className="mt-1 block truncate text-sm">{name}</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}
