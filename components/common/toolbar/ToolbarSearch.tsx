'use client'

import Icon from '@/components/ui/Icon'

import { useTranslations } from 'next-intl'

export default function ToolbarSearch({

                                          value,
                                          onChange,

                                          placeholder

                                      }: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}) {

    const t = useTranslations('common.actions')
    const resolvedPlaceholder = placeholder ?? (t('search') + '...')

    return (

        <div
            className="
                relative
                w-full

                sm:w-72
            "
        >

            <Icon
                name="search"
                size={16}
                className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-subtle
                "
            />

            <input

                value={value}

                onChange={(e) =>
                    onChange(
                        e.target.value
                    )
                }

                placeholder={resolvedPlaceholder}

                className="
                    w-full
                    h-10
                    pl-10
                    pr-4
                    rounded-lg
                    border
                    border-divider
                    bg-surface
                    text-foreground
                    placeholder:text-subtle
                    outline-none

                    focus:ring-2
                    focus:ring-primary/30
                    focus:border-primary
                "
            />

        </div>
    )
}
