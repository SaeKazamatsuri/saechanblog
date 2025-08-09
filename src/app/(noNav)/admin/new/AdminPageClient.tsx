'use client'

// 機能: 管理画面(新規投稿) クライアント本体
import { useRef, useState, useEffect, useCallback } from 'react'
import type { Category } from '@/lib/posts'
import { useToast } from '@/components/admin/ToastProvider' // 機能: トースト表示
import { getJst, fmtDate } from '@/components/admin/time'
import ToastEditorClient from '@/components/admin/ToastEditorClient'
import { Tabs, type Tab } from '@/components/admin/Tabs'
import PostTab from '@/components/admin/PostTab'
import ImageTab from '@/components/admin/ImageTab'
import SEOTab from '@/components/admin/SEOTab'
import PreviewPanel from '@/components/admin/PreviewPanel'
import { useConfirm } from '@/components/admin/ConfirmModal' // 機能: モーダルconfirm
import { useUnsavedChangesGuard } from '@/components/admin/useUnsavedChangesGuard' // 機能: 未保存ガード

type Props = {
	initialCategories: Category[] // 変数: 初期カテゴリ
}

export default function AdminPageClient({ initialCategories }: Props) {
	// 変数: Editor参照
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const editorRef = useRef<any>(null)

	// 変数: カテゴリ
	const [categories, setCategories] = useState<Category[]>(initialCategories)
	const [category, setCategory] = useState(initialCategories[0]?.slug ?? '')

	// 変数: タイトル/日付
	const [title, setTitle] = useState('')
	const [date, setDate] = useState(fmtDate(getJst()))

	// 変数: 下書きフラグ
	const [isDraft, setIsDraft] = useState(true)

	// 変数: SEO
	const [description, setDescription] = useState('')
	const [tags, setTags] = useState<string[]>([])
	const [coverUrl, setCoverUrl] = useState('')

	// 変数: ファイル名
	const [filename, setFilename] = useState('')

	// 変数: 未保存フラグ
	const [isDirty, setIsDirty] = useState(false)
	// 変数: 一度でも保存済みフラグ
	const [hasSavedOnce, setHasSavedOnce] = useState(false)

	// 変数: トースト
	const pushToast = useToast()

	// 変数: confirm
	const { confirm, ConfirmDialog } = useConfirm()

	// 変数: タブ
	const [tab, setTab] = useState<Tab>('post')

	// 機能: サーバーから受け取ったカテゴリで初期化
	useEffect(() => {
		setCategories(initialCategories)
		if (!category && initialCategories.length) {
			setCategory(initialCategories[0].slug)
		}
	}, [initialCategories]) // 依存: サーバーからのカテゴリ

	// 機能: front-matter生成
	const buildFrontMatter = (draftFlag: boolean, mdBody: string) => {
		const fmLines: string[] = [
			'---',
			`title: '${title.replace(/'/g, "''")}'`,
			`date: '${date}'`,
			`draft: ${draftFlag ? 'true' : 'false'}`,
			`description: '${description.replace(/'/g, "''")}'`,
			`cover: '${(coverUrl.split('/').pop() || '').toString()}'`,
			`tags: [${tags.map(t => `'${t}'`).join(', ')}]`,
			'---',
		]
		return `${fmLines.join('\n')}\n\n${mdBody}`
	}

	// 機能: 全入力リセット
	const resetAll = useCallback(() => {
		setTitle('')
		setDate(fmtDate(getJst()))
		setIsDraft(true)
		setDescription('')
		setTags([])
		setCoverUrl('')
		setFilename('')
		setHasSavedOnce(false)
		if (categories.length) setCategory(categories[0].slug)
		editorRef.current?.getInstance()?.setMarkdown('## はじめましょう')
		setIsDirty(false)
	}, [categories])

	// 機能: 保存/投稿
	const savePost = async (
		overwrite = false,
		opts?: { forceDraft?: boolean; auto?: boolean; asPost?: boolean },
	) => {
		const md = editorRef.current?.getInstance()?.getMarkdown()
		if (!md || !filename || !title || !date) {
			if (opts?.auto) return
			pushToast('タイトル・日付・ファイル名・本文を確認してね')
			setTab('post')
			return
		}

		const draftFlag = opts?.forceDraft ?? isDraft
		const content = buildFrontMatter(draftFlag, md)
		const sendOverwrite = overwrite || (opts?.asPost && hasSavedOnce) || false

		const res = await fetch('/api/save-post', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				content,
				category,
				filename,
				overwrite: sendOverwrite,
			}),
		})

		if (res.status === 409) {
			if (opts?.auto) return
			if (opts?.asPost || hasSavedOnce) {
				await savePost(true, opts)
				return
			}
			const ok = await confirm('同名ファイルがあります。上書きする？', {
				title: '確認',
				confirmText: '上書きする',
				cancelText: 'キャンセル',
			})
			if (ok) {
				await savePost(true, opts)
			} else {
				pushToast('保存をキャンセルしたよ')
			}
			return
		}

		if (opts?.auto) {
			if (res.ok) {
				setIsDirty(false)
				setHasSavedOnce(true)
				pushToast('自動下書き保存しました')
			}
			return
		}

		if (res.ok) {
			setIsDirty(false)
			setHasSavedOnce(true)
			if (opts?.asPost) {
				pushToast('投稿したよ')
				resetAll()
			} else {
				pushToast('保存したよ')
			}
		} else {
			pushToast('保存に失敗しちゃった…')
		}
	}

	// 機能: 自動下書き保存(10分毎)
	useEffect(() => {
		const AUTOSAVE_MS = 10 * 60 * 1000
		const id = setInterval(() => {
			if (!filename) return
			void savePost(true, { forceDraft: true, auto: true })
		}, AUTOSAVE_MS)
		return () => clearInterval(id)
	}, [category, filename, title, date, description, tags, coverUrl])

	// 機能: 未保存フラグ更新
	const markDirty = useCallback(() => setIsDirty(true), [])
	const setTitleDirty = (v: string) => { setTitle(v); markDirty() }
	const setDateDirty = (v: string) => { setDate(v); markDirty() }
	const setIsDraftDirty = (v: boolean) => { setIsDraft(v); markDirty() }
	const setCategoryDirty = (v: string) => { setCategory(v); markDirty() }
	const setFilenameDirty = (v: string) => { setFilename(v); setHasSavedOnce(false); markDirty() }
	const setDescriptionDirty = (v: string) => { setDescription(v); markDirty() }
	const setTagsDirty = (v: string[]) => { setTags(v); markDirty() }
	const setCoverUrlDirty = (v: string) => { setCoverUrl(v); markDirty() }
	const onEditorChange = () => markDirty()

	// 機能: 未保存ガード
	useUnsavedChangesGuard(isDirty, confirm)

	if (!category) {
		return <p className="p-6">Loading…</p>
	}

	return (
		<section className="p-6 space-y-6">
			<div className="flex flex-col lg:flex-row gap-6">
				{/* 左カラム */}
				<div className="w-full lg:w-1/2 p-6 bg-gray-50 rounded-sm border border-gray-200">
					<Tabs active={tab} onChange={setTab} />

					{tab === 'post' && (
						<PostTab
							categories={categories}
							category={category}
							setCategory={setCategoryDirty}
							title={title}
							setTitle={setTitleDirty}
							date={date}
							setDate={setDateDirty}
							filename={filename}
							setFilename={setFilenameDirty}
							onPost={() => {
								setIsDraftDirty(false)
								void savePost(false, { forceDraft: false, asPost: true })
							}}
							onSaveDraft={() => {
								setIsDraftDirty(true)
								void savePost(false, { forceDraft: true })
							}}
						/>
					)}

					{tab === 'image' && (
						<ImageTab
							categories={categories}
							category={category}
						/>
					)}

					{tab === 'seo' && (
						<SEOTab
							description={description}
							setDescription={setDescriptionDirty}
							tags={tags}
							setTags={setTagsDirty}
							coverUrl={coverUrl}
							setCoverUrl={setCoverUrlDirty}
							categories={categories}
							category={category}
						/>
					)}
				</div>

				{/* 右カラム */}
				<PreviewPanel title={title} date={date} tags={tags} />
			</div>

			{/* Editor */}
			<ToastEditorClient ref={editorRef} category={category} onChange={onEditorChange} />

			{/* Confirm */}
			<ConfirmDialog />
		</section>
	)
}
