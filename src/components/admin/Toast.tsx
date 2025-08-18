'use client'

import { useEffect, useState } from 'react'

type Props = {
    message: string

    duration?: number
    onClose: () => void
}

export default function Toast({ message, duration = 3000, onClose }: Props) {
    const [visible, setVisible] = useState(false)
    const TRANSITION_MS = 300

    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true))
        return () => cancelAnimationFrame(id)
    }, [])

    useEffect(() => {
        const id = setTimeout(() => setVisible(false), duration)
        return () => clearTimeout(id)
    }, [duration])

    useEffect(() => {
        if (!visible) {
            const id = setTimeout(onClose, TRANSITION_MS)
            return () => clearTimeout(id)
        }
    }, [visible, onClose])

    return (
        <div
            role="status"
            className={`
        pointer-events-auto
        w-80 max-w-full rounded-lg bg-green-600 px-6 py-4 text-base text-white shadow-lg
        transition ease-out duration-300             
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
      `}
        >
            {message}
        </div>
    )
}
