'use client'

import {
    createContext,
    useContext,
    useRef,
    useState
} from 'react'
import type { ReactNode } from 'react'

import {
    useKeyDown
} from '../../lib/hooks/useKeyDown'
import { useTranslations } from 'next-intl'

interface DialogContextType {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prompt: (opts?: Record<string, any>) => Promise<string | null>
}

const DialogContext = createContext<DialogContextType | null>(null)

export function useDialog() {
    const ctx = useContext(DialogContext)
    if (!ctx) throw new Error('useDialog must be used inside DialogProvider')
    return ctx
}

export default function DialogProvider({ children }: { children: ReactNode }) {

    const t = useTranslations('common')
    const resolverRef = useRef<((v: string | null) => void) | null>(null)

    const [state, setState] = useState({
        open: false,
        title: '',
        description: '',
        placeholder: '',
        confirmLabel: 'Konfirmasi',
        confirmClassName: 'bg-blue-600 hover:bg-blue-700 text-white',
        value: ''
    })

    function prompt({
        title = '',
        description = '',
        placeholder = '',
        confirmLabel = 'Konfirmasi',
        confirmClassName = 'bg-blue-600 hover:bg-blue-700 text-white'
    } = {}) {

        return new Promise<string | null>((resolve) => {

            resolverRef.current = resolve

            setState({
                open: true,
                title,
                description,
                placeholder,
                confirmLabel,
                confirmClassName,
                value: ''
            })
        })
    }

    function handleConfirm() {
        resolverRef.current?.(state.value || null)
        setState(s => ({ ...s, open: false }))
    }

    function handleCancel() {
        resolverRef.current?.(null)
        setState(s => ({ ...s, open: false }))
    }

    useKeyDown(state.open, {
        Escape: handleCancel,
        Enter: (e) => {
            if (e.ctrlKey) handleConfirm()
        }
    })

    return (

        <DialogContext.Provider value={{ prompt }}>

            {children}

            {state.open && (

                <div
                    className="
                        fixed
                        inset-0
                        z-[9998]
                        bg-black/40
                        flex
                        items-center
                        justify-center
                        px-4
                    "
                >

                    <div
                        className="
                            bg-white
                            rounded-2xl
                            shadow-xl
                            w-full
                            max-w-md
                            p-6
                            space-y-4
                        "
                    >

                        {state.title && (
                            <div>
                                <h2
                                    className="
                                        text-lg
                                        font-semibold
                                    "
                                >
                                    {state.title}
                                </h2>

                                {state.description && (
                                    <p
                                        className="
                                            text-sm
                                            text-slate-500
                                            mt-1
                                        "
                                    >
                                        {state.description}
                                    </p>
                                )}
                            </div>
                        )}

                        <textarea
                            autoFocus
                            rows={4}
                            value={state.value}
                            onChange={e =>
                                setState(s => ({
                                    ...s,
                                    value: e.target.value
                                }))
                            }
                            placeholder={state.placeholder}
                            className="
                                w-full
                                border
                                rounded-xl
                                p-3
                                text-sm
                                resize-none
                                outline-none
                                focus:ring-2
                                focus:ring-blue-500/20
                                focus:border-blue-500
                            "
                        />

                        <div
                            className="
                                flex
                                justify-end
                                gap-2
                            "
                        >

                            <button
                                onClick={handleCancel}
                                className="
                                    px-4
                                    py-2
                                    rounded-xl
                                    border
                                    text-sm
                                    hover:bg-slate-50
                                    transition
                                "
                            >
                                {t('actions.cancel')}
                            </button>

                            <button
                                onClick={handleConfirm}
                                className={`
                                    px-4
                                    py-2
                                    rounded-xl
                                    text-sm
                                    transition
                                    ${state.confirmClassName}
                                `}
                            >
                                {state.confirmLabel}
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </DialogContext.Provider>
    )
}
