'use client'

import Icon from '@/components/ui/Icon'

interface Props {
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    loading?: boolean
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmDialog({
    open, title, message,
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    loading = false,
    onConfirm, onCancel,
}: Props) {
    if (!open) return null
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div role="dialog" aria-modal="true" className="bg-surface rounded-xl shadow-default p-6 w-full max-w-sm space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-danger/10 rounded-xl">
                        <Icon name="alert-triangle" size={20} className="text-danger" />
                    </div>
                    <h2 className="text-base font-semibold text-foreground">{title}</h2>
                </div>
                <p className="text-sm text-muted">{message}</p>
                <div className="flex justify-end gap-2 pt-1">
                    <button
                        onClick={onCancel}
                        className="border border-divider rounded-lg px-4 py-2 text-sm text-muted hover:bg-canvas"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="bg-danger hover:bg-danger/80 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
