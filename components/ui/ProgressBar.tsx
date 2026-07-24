'use client'

interface Props {
    value:     number   // 0–100
    label?:    string
    sublabel?: string
}

export default function ProgressBar({ value, label, sublabel }: Props) {
    const clamped = Math.min(100, Math.max(0, value))
    return (
        <div className="space-y-1.5 w-full">
            {(label || sublabel) && (
                <div className="flex items-center justify-between text-sm">
                    {label    && <span className="font-medium text-foreground">{label}</span>}
                    {sublabel && <span className="text-xs text-muted">{sublabel}</span>}
                </div>
            )}
            <div className="h-2 rounded-full bg-canvas border border-divider overflow-hidden">
                <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${clamped}%` }}
                />
            </div>
        </div>
    )
}
