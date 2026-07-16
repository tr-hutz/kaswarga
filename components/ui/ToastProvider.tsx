'use client'

import {
    createContext,
    useCallback,
    useContext,
    useState
} from 'react'
import type { ReactNode } from 'react'

import {
    AlertCircle,
    CheckCircle,
    Info,
    X
} from 'lucide-react'

interface ToastOptions {
    title?: string
    message?: string
    type?: 'error' | 'success' | 'info'
    duration?: number
    onClick?: () => void
}

interface ToastContextType {
    toast: (opts: ToastOptions) => void
}

interface ToastItem extends ToastOptions {
    id: string
}

const ToastContext = createContext<ToastContextType | null>(null)

const STYLES = {
    error: {
        container: 'bg-red-50 border-red-200 text-red-800',
        icon: 'text-red-500'
    },
    success: {
        container: 'bg-green-50 border-green-200 text-green-800',
        icon: 'text-green-500'
    },
    info: {
        container: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: 'text-blue-500'
    }
}

const ICONS = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info
}

export default function ToastProvider({ children }: { children: ReactNode }) {

    const [
        toasts,
        setToasts
    ] = useState<ToastItem[]>([])

    const dismiss = useCallback((id: string) => {
        setToasts(prev =>
            prev.filter(t => t.id !== id)
        )
    }, [])

    const toast = useCallback((opts: ToastOptions) => {
        const { title, message, type = 'info', duration = 4000, onClick } = opts
        const id = crypto.randomUUID()

        setToasts(prev => [
            ...prev,
            { id, title, message, type, onClick }
        ])

        if (duration > 0) {
            setTimeout(() => dismiss(id), duration)
        }
    }, [dismiss])

    return (

        <ToastContext.Provider value={{ toast }}>

            {children}

            <div
                className="
                    fixed
                    top-4
                    right-4
                    z-[9999]
                    flex
                    flex-col
                    gap-2
                    w-full
                    max-w-sm
                    pointer-events-none
                "
            >

                {toasts.map(t => {

                    const style = STYLES[t.type ?? 'info'] || STYLES.info
                    const Icon = ICONS[t.type ?? 'info'] || Info

                    return (

                        <div
                            key={t.id}
                            onClick={t.onClick ? () => { dismiss(t.id); t.onClick!() } : undefined}
                            className={`
                                pointer-events-auto
                                border
                                rounded-2xl
                                p-4
                                shadow-lg
                                flex
                                items-start
                                gap-3
                                ${style.container}
                                ${t.onClick ? 'cursor-pointer hover:brightness-95' : ''}
                            `}
                        >

                            <Icon
                                className={`
                                    w-5
                                    h-5
                                    shrink-0
                                    mt-0.5
                                    ${style.icon}
                                `}
                            />

                            <div className="flex-1 min-w-0">

                                {t.title && (
                                    <div className="font-semibold text-sm mb-0.5">
                                        {t.title}
                                    </div>
                                )}

                                <span
                                    className="
                                        text-sm
                                        leading-snug
                                    "
                                >
                                    {t.message}
                                </span>

                            </div>

                            <button
                                onClick={e => { e.stopPropagation(); dismiss(t.id) }}
                                className="
                                    shrink-0
                                    opacity-60
                                    hover:opacity-100
                                    transition
                                "
                            >
                                <X className="w-4 h-4" />
                            </button>

                        </div>
                    )
                })}

            </div>

        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used inside ToastProvider')
    return ctx
}
