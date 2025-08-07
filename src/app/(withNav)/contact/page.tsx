// app/components/ContactForm.tsx など
'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface ContactFormState {
    name: string
    email: string
    message: string
}

const MAX_MESSAGE = 2000

/* --- 固定メッセージ --- */
const MSG = {
    nameRequired: 'お名前を入力してください',
    emailRequired: 'メールアドレスを入力してください',
    emailInvalid: 'メールアドレスの形式が正しくありません',
    messageRequired: 'メッセージを入力してください',
    messageTooLong: `メッセージは ${MAX_MESSAGE} 文字以内で入力してください`,
    hasError: '入力内容を確認してください',
    sendFailed: '送信に失敗しました。時間を置いて再度お試しください。',
    sendSuccess: '送信が完了しました。ありがとうございます！',
}

/* GAS 送信先 */
const GAS_ENDPOINT =
    'https://script.google.com/macros/s/AKfycbznQkzOBVva6ztSKHh3-QfPJK08MaBxwLWphdzl0aZH1OHha_s04lgmGXudES7TGM0/exec'

/* よく使われるドメイン（サジェスト用） */
const COMMON_DOMAINS = [
    'gmail.com',
    'outlook.com',
    'yahoo.co.jp',
    'icloud.com',
    'hotmail.com',
    'proton.me',
]

const ContactForm: React.FC = () => {
    /* フォーム状態 */
    const [form, setForm] = useState<ContactFormState>({
        name: '',
        email: '',
        message: '',
    })

    /* エラーメッセージ */
    const [errors, setErrors] = useState<Record<keyof ContactFormState, string>>({
        name: '',
        email: '',
        message: '',
    })

    /* dirty フラグ */
    const [dirty, setDirty] = useState<Record<keyof ContactFormState, boolean>>({
        name: false,
        email: false,
        message: false,
    })

    /* その他状態 */
    const [globalError, setGlobalError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [emailSuggestion, setEmailSuggestion] = useState('')
    const [submittedOnce, setSubmittedOnce] = useState(false)

    /* --- バリデーション --- */
    const validateField = useCallback(
        (key: keyof ContactFormState, value: string): string => {
            const v = value.trim()
            switch (key) {
                case 'name':
                    return v ? '' : MSG.nameRequired
                case 'email':
                    if (!v) return MSG.emailRequired
                    // 簡易判定で十分ならこれで OK
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    return emailRegex.test(v) ? '' : MSG.emailInvalid
                case 'message':
                    if (!v) return MSG.messageRequired
                    if (v.length > MAX_MESSAGE) return MSG.messageTooLong
                    return ''
                default:
                    return ''
            }
        },
        []
    )

    const validateAll = useCallback((): boolean => {
        const newErrors: Record<keyof ContactFormState, string> = {
            name: validateField('name', form.name),
            email: validateField('email', form.email),
            message: validateField('message', form.message),
        }
        setErrors(newErrors)
        return !newErrors.name && !newErrors.email && !newErrors.message
    }, [form, validateField])

    /* 入力ハンドラ */
    const handleChange =
        (field: keyof ContactFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const value = e.target.value
            setForm((prev) => ({ ...prev, [field]: value }))
            if (!dirty[field]) setDirty((d) => ({ ...d, [field]: true }))
        }

    /* 入力監視（リアルタイムバリデーション＆グローバルエラー解除） */
    useEffect(() => {
        if (submittedOnce) {
            // 送信後は常時リアルタイムで
            (['name', 'email', 'message'] as const).forEach((k) => {
                const e = validateField(k, form[k])
                setErrors((prev) => (prev[k] === e ? prev : { ...prev, [k]: e }))
            })
        }
        if (globalError && validateAll()) setGlobalError('')
    }, [form, submittedOnce, globalError, validateAll, validateField])

    /* メールドメインサジェスト */
    useEffect(() => {
        const parts = form.email.split('@')
        if (parts.length === 2) {
            const domain = parts[1]
            if (domain && !COMMON_DOMAINS.includes(domain)) {
                const suggestion = COMMON_DOMAINS.find(
                    (d) => Math.abs(d.length - domain.length) <= 3 && d[0] === domain[0]
                )
                if (suggestion) {
                    setEmailSuggestion(parts[0] + '@' + suggestion)
                    return
                }
            }
        }
        setEmailSuggestion('')
    }, [form.email])

    /* インプット共通クラス */
    const fieldClasses = (field: keyof ContactFormState): string => {
        const base =
            'block w-full rounded-md border px-3.5 py-2 text-sm placeholder-gray-400 transition focus:outline-none'
        const normal = 'bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        const error =
            'border-red-500 focus:border-red-500 focus:ring-red-500'
        return [base, dirty[field] && errors[field] ? error : normal].join(' ')
    }

    /* 送信 */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmittedOnce(true)
        setGlobalError('') // 初期化

        // 全 dirty 化してエラー表示
        setDirty({ name: true, email: true, message: true })

        if (!validateAll()) {
            setGlobalError(MSG.hasError)
            return
        }

        setLoading(true)
        try {
            await fetch(GAS_ENDPOINT, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    message: form.message,
                    source: 'next-contact-form',
                }),
            })
            // 成功時リセット
            setForm({ name: '', email: '', message: '' })
            setErrors({ name: '', email: '', message: '' })
            setDirty({ name: false, email: false, message: false })
            setShowSuccessModal(true)
            setSubmittedOnce(false)
            setGlobalError('')
        } catch (e) {
            setGlobalError(MSG.sendFailed)
        } finally {
            setLoading(false)
        }
    }

    /* サジェストを採用 */
    const applySuggestion = () => {
        if (emailSuggestion) {
            setForm((prev) => ({ ...prev, email: emailSuggestion }))
            setEmailSuggestion('')
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-12">
            {/* ヒーローセクション */}
            <section className="text-center mb-16">
                <h1 className="text-4xl font-bold tracking-tight">
                    お問い合わせフォーム
                </h1>
            </section>

            <form onSubmit={handleSubmit} className="space-y-6 my-10">
                {/* 名前 */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-900">
                        お名前
                    </label>
                    <input
                        id="name"
                        type="text"
                        className={fieldClasses('name')}
                        value={form.name}
                        onChange={handleChange('name')}
                        disabled={loading}
                    />
                    {dirty.name && errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                </div>

                {/* メールアドレス */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                        メールアドレス
                    </label>
                    <input
                        id="email"
                        type="email"
                        className={fieldClasses('email')}
                        value={form.email}
                        onChange={handleChange('email')}
                        disabled={loading}
                    />
                    {emailSuggestion && (
                        <p className="mt-1 text-sm">
                            型が違うかも？&nbsp;
                            <button
                                type="button"
                                onClick={applySuggestion}
                                className="text-blue-600 underline hover:no-underline"
                            >
                                {emailSuggestion} に修正
                            </button>
                        </p>
                    )}
                    {dirty.email && errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                </div>

                {/* メッセージ */}
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-900">
                        メッセージ
                    </label>
                    <textarea
                        id="message"
                        rows={6}
                        className={fieldClasses('message')}
                        value={form.message}
                        onChange={handleChange('message')}
                        disabled={loading}
                    />
                    <p className="text-xs text-gray-500 text-right">{form.message.length} / {MAX_MESSAGE}</p>
                    {dirty.message && errors.message && (
                        <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                    )}
                </div>

                {/* 送信ボタン & エラー表示 */}
                {globalError && (
                    <p className="text-center text-red-600">{globalError}</p>
                )}
                <div className="flex justify-center">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center rounded-md bg-gray-800 px-6 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                        {loading ? '送信中…' : '送信'}
                    </button>
                </div>
            </form>

            {/* 成功モーダル */}
            {showSuccessModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                >
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow">
                        <p className="mb-4">{MSG.sendSuccess}</p>
                        <button
                            className="rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
                            onClick={() => setShowSuccessModal(false)}
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ContactForm
