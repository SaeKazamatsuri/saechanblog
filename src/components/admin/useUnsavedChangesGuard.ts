'use client'

import { useCallback, useEffect, useRef } from 'react'

// 機能: 未保存時のタブ閉じ/戻るガード
export function useUnsavedChangesGuard(
    enabled: boolean,
    confirm: (
        message: string,
        options?: { title?: string; confirmText?: string; cancelText?: string }
    ) => Promise<boolean>
) {
    // 変数: 有効フラグ参照
    const enabledRef = useRef(enabled)
    useEffect(() => {
        enabledRef.current = enabled
    }, [enabled])

    // 変数: 有効化済みトラッカー
    const armedRef = useRef(enabled)
    // 変数: 次のpopstateを無視
    const ignoreNextPopRef = useRef(false)

    // 機能: センチネルpush
    const pushSentinel = useCallback(() => {
        try {
            history.pushState({ __unsaved_guard__: 1 }, '', location.href)
        } catch {}
    }, [])

    // 機能: 有効化時にセンチネル投入
    useEffect(() => {
        if (enabled && !armedRef.current) {
            pushSentinel()
            armedRef.current = true
        }
        if (!enabled) {
            armedRef.current = false
        }
    }, [enabled, pushSentinel])

    useEffect(() => {
        // 機能: タブ閉じ/リロード標準ダイアログ
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!enabledRef.current) return
            e.preventDefault()
            e.returnValue = ''
        }
        window.addEventListener('beforeunload', onBeforeUnload)

        // 機能: 戻るボタン時のモーダル
        const onPopState = async () => {
            if (!enabledRef.current) return
            if (ignoreNextPopRef.current) {
                ignoreNextPopRef.current = false
                return
            }
            const ok = await confirm('未保存の変更があります。破棄して移動しますか？', {
                title: '確認',
                confirmText: '破棄して移動',
                cancelText: 'キャンセル',
            })
            if (ok) {
                enabledRef.current = false
                ignoreNextPopRef.current = true
                history.back()
            } else {
                pushSentinel()
            }
        }

        window.addEventListener('popstate', onPopState)
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload)
            window.removeEventListener('popstate', onPopState)
        }
    }, [confirm, pushSentinel])
}
