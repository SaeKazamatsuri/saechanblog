'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import Toast from './Toast'

type ToastItem = { id: number; message: string; duration?: number }
type ToastContextValue = {
    pushToast: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const pushToast = useCallback((message: string, duration?: number) => {
        setToasts((prev) => [{ id: Date.now(), message, duration }, ...prev])
    }, [])

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ pushToast }}>
            {children}

            {}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
                {toasts.map((t) => (
                    <Toast key={t.id} message={t.message} duration={t.duration} onClose={() => removeToast(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast(): (message: string, duration?: number) => void {
    const ctx = useContext(ToastContext)
    if (!ctx) {
        throw new Error('useToast は <ToastProvider> の内側で使ってね')
    }
    return ctx.pushToast
}
