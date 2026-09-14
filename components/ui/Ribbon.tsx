'use client'

export type RibbonType =
    // Transaction / member statuses
    | 'pending' | 'approved' | 'rejected' | 'active' | 'inactive'
    // Deployment environments
    | 'local' | 'dev' | 'sit' | 'uat' | 'staging' | 'preview'

interface Props {
    /** Display text. Falls back to the `type` value when omitted. */
    label?:  string
    type:    RibbonType
    variant: 'filled' | 'rounded' | 'diagonal'
}

const FILLED: Record<string, string> = {
    // statuses
    approved: 'bg-success text-white',
    pending:  'bg-warning text-white',
    rejected: 'bg-danger  text-white',
    active:   'bg-success text-white',
    inactive: 'bg-muted   text-white',
    // environments
    local:    'bg-green-600  text-white',
    dev:      'bg-green-600  text-white',
    sit:      'bg-blue-600   text-white',
    uat:      'bg-orange-500 text-white',
    staging:  'bg-amber-500  text-white',
    preview:  'bg-red-500    text-white',
}

const ROUNDED: Record<string, string> = {
    // statuses
    approved: 'bg-success/10 text-success',
    pending:  'bg-warning/10 text-warning',
    rejected: 'bg-danger/10  text-danger',
    active:   'bg-success/10 text-success',
    inactive: 'bg-canvas     text-muted',
    // environments
    local:    'bg-green-600/10  text-green-600',
    sit:      'bg-blue-600/10   text-blue-600',
    uat:      'bg-orange-500/10 text-orange-500',
    staging:  'bg-amber-500/10  text-amber-500',
    preview:  'bg-red-500/10    text-red-500',
}

export default function Ribbon({ label, type, variant }: Props) {
    const displayLabel = label ?? type.toUpperCase()
    const color        = variant === 'rounded'
        ? (ROUNDED[type] ?? ROUNDED.pending)
        : (FILLED[type]  ?? FILLED.pending)

    if (variant === 'diagonal') {
        // cx = cy = 24px so the text center sits exactly on the y=x diagonal,
        // which is the midpoint of the visible band (0,48)→(48,0) in the 64px header.
        return (
            <span className={`absolute top-3 -left-6 w-24 -rotate-45 py-1.5 text-center text-[9px] font-bold uppercase select-none ${color}`}>
                {displayLabel}
            </span>
        )
    }

    if (variant === 'filled') {
        return (
            <div className={`absolute top-0 left-0 px-3 py-1 text-xs font-semibold rounded-br-lg ${color}`}>
                {displayLabel}
            </div>
        )
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
            {displayLabel}
        </span>
    )
}
