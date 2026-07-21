import Image from 'next/image'

interface Props {
    name?: string | null
    src?: string | null
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const SIZE: Record<string, { cls: string; px: number }> = {
    sm: { cls: 'h-7 w-7 text-xs',   px: 28 },
    md: { cls: 'h-9 w-9 text-sm',   px: 36 },
    lg: { cls: 'h-11 w-11 text-base', px: 44 },
}

function initials(name: string): string {
    return name.trim().split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function Avatar({ name, src, size = 'md', className = '' }: Props) {
    const { cls, px } = SIZE[size]
    if (src) {
        return (
            <Image
                src={src}
                alt={name ?? 'Avatar'}
                width={px}
                height={px}
                className={`${cls} rounded-full object-cover ${className}`}
            />
        )
    }
    return (
        <div className={`${cls} rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 ${className}`}>
            {name ? initials(name) : '?'}
        </div>
    )
}
