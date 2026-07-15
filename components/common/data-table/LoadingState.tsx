'use client'

interface Props {
    columns: number
}

export default function LoadingState({ columns }: Props) {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} data-testid={i === 0 ? 'dt-loading' : undefined} className="border-t border-gray-100">
                    {Array.from({ length: columns }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    )
}
