'use client'

import dynamic from 'next/dynamic'
import { forwardRef } from 'react'
import { makeRenderer } from './htmlRenderer'

// 機能: Toast UI Editorの動的import+ラッパー
const Editor = dynamic(
	() => import('@toast-ui/react-editor').then(m => m.Editor),
	{ ssr: false },
)

type Props = {
	category: string
	onChange?: () => void
}

const ToastEditorClient = forwardRef<any, Props>(function ToastEditorClient(
	{ category, onChange },
	ref,
) {
	return (
		<Editor
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			ref={ref as any}
			key={category}
			initialValue="## はじめましょう"
			previewStyle="vertical"
			height="70vh"
			initialEditType="markdown"
			hideModeSwitch={false}
			usageStatistics={false}
			customHTMLRenderer={makeRenderer(category)}
			onChange={onChange}
		/>
	)
})

export default ToastEditorClient
