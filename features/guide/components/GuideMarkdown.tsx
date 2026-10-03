'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm    from 'remark-gfm'
import type { Components } from 'react-markdown'

const components: Components = {
    h1: ({ children }) => (
        <h1 className="text-xl font-bold text-foreground mt-6 mb-3 first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-base font-semibold text-foreground mt-5 mb-2 first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-sm font-semibold text-foreground mt-4 mb-1.5">{children}</h3>
    ),
    p: ({ children }) => (
        <p className="text-sm text-foreground leading-relaxed mb-3 last:mb-0">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="list-disc pl-5 mb-3 space-y-1 text-sm text-foreground">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm text-foreground">{children}</ol>
    ),
    li: ({ children }) => (
        <li className="leading-relaxed">{children}</li>
    ),
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em:     ({ children }) => <em className="italic">{children}</em>,
    hr:     () => <hr className="my-4 border-divider" />,
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
        >
            {children}
        </a>
    ),
    img: ({ src, alt }) => (
        <span className="block my-4">
            <img
                src={src}
                alt={alt ?? ''}
                className="rounded-lg max-w-full border border-divider shadow-sm"
                loading="lazy"
            />
            {alt && (
                <span className="block text-xs text-muted mt-1.5 text-center italic">{alt}</span>
            )}
        </span>
    ),
    code: ({ children, className }) => {
        const isBlock = className?.startsWith('language-')
        return isBlock ? (
            <code className="block bg-canvas rounded-lg p-3 text-xs font-mono overflow-x-auto my-3 border border-divider">
                {children}
            </code>
        ) : (
            <code className="bg-canvas px-1.5 py-0.5 rounded text-xs font-mono border border-divider">
                {children}
            </code>
        )
    },
    blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-primary/30 pl-4 my-3 text-muted italic">
            {children}
        </blockquote>
    ),
    table: ({ children }) => (
        <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse border border-divider rounded-lg overflow-hidden">
                {children}
            </table>
        </div>
    ),
    th: ({ children }) => (
        <th className="px-3 py-2 text-left font-semibold text-foreground bg-canvas border-b border-divider">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="px-3 py-2 text-foreground border-b border-divider last:border-b-0">
            {children}
        </td>
    ),
}

interface Props {
    body: string
    className?: string
}

export default function GuideMarkdown({ body, className }: Props) {
    return (
        <div className={className}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {body}
            </ReactMarkdown>
        </div>
    )
}
