interface Props {
    name?: string | null
    src?: string | null
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const SIZE: Record<string, string> = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
}

function initials(name: string): string {
    return name.trim().split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function Avatar({ name, src, size = 'md', className = '' }: Props) {
    const sizeClass = SIZE[size]
    if (src) {
        return (
            <img
                src={src}
                alt={name ?? 'Avatar'}
                className={`${sizeClass} rounded-full object-cover ${className}`}
            />
        )
    }
    return (
        <div className={`${sizeClass} rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 ${className}`}>
            {name ? initials(name) : '?'}
        </div>
    )
}
