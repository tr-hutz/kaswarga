'use client'

import Icon from '@/components/ui/Icon'

import { useTranslations } from 'next-intl'

export default function ToolbarFilter({

                                          value,
                                          onChange,

                                          options = [],

                                          placeholder

                                      }: {
    value: string
    onChange: (value: string) => void
    options?: { value: string; label: string }[]
    placeholder?: string
}) {

    const t = useTranslations('common.filter')
    const resolvedPlaceholder = placeholder ?? t('placeholder')

    return (

        <div
            className="
                relative
                w-full

                sm:w-52
            "
        >

            <Icon
                name="funnel"
                size={16}
                className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-dark-6
                    pointer-events-none
                "
            />

            <select

                value={value}

                onChange={(e) =>
                    onChange(
                        e.target.value
                    )
                }

                className="
                    w-full
                    h-10
                    pl-10
                    pr-4
                    rounded-lg
                    border
                    border-stroke
                    bg-white
                    text-dark
                    outline-none

                    focus:ring-2
                    focus:ring-primary/30
                    focus:border-primary
                "
            >

                <option value="all">
                    {resolvedPlaceholder}
                </option>

                {
                    options.map(option => (

                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>

                    ))
                }

            </select>

        </div>
    )
}
