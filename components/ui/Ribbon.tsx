'use client'

type Status = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive'

interface Props {
    label:   string
    status:  Status
    variant: 'filled' | 'rounded'
}

const FILLED: Record<string, string> = {
    approved: 'bg-success text-white',
    pending:  'bg-warning text-white',
    rejected: 'bg-danger  text-white',
    active:   'bg-success text-white',
    inactive: 'bg-muted   text-white',
}

const ROUNDED: Record<string, string> = {
    approved: 'bg-success/10 text-success',
    pending:  'bg-warning/10 text-warning',
    rejected: 'bg-danger/10  text-danger',
    active:   'bg-success/10 text-success',
    inactive: 'bg-canvas     text-muted',
}

export default function Ribbon({ label, status, variant }: Props) {
    if (variant === 'filled') {
        const color = FILLED[status] ?? FILLED.pending
        return (
            <div className={`absolute top-0 left-0 px-3 py-1 text-xs font-semibold rounded-br-lg ${color}`}>
                {label}
            </div>
        )
    }
    const color = ROUNDED[status] ?? ROUNDED.pending
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
            {label}
        </span>
    )
}
