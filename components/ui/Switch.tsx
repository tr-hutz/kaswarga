'use client'

interface Props {
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string
    disabled?: boolean
}

export default function Switch({ checked, onChange, label, disabled = false }: Props) {
    return (
        <label className="inline-flex items-center gap-3 cursor-pointer select-none">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={`
                    relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary/30
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${checked ? 'bg-primary' : 'bg-stroke'}
                `}
            >
                <span
                    className={`
                        mt-0.5 inline-block h-5 w-5 rounded-full bg-white shadow-sm
                        transform transition-transform duration-200
                        ${checked ? 'translate-x-5' : 'translate-x-0.5'}
                    `}
                />
            </button>
            {label && <span className="text-sm text-foreground">{label}</span>}
        </label>
    )
}
