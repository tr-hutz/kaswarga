// @ts-nocheck
'use client'

import {
    Funnel
} from 'lucide-react'

import { useTranslations } from 'next-intl'

export default function ToolbarFilter({

                                          value,
                                          onChange,

                                          options = [],

                                          placeholder

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

            <Funnel
                size={16}
                className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
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
                    h-11
                    pl-10
                    pr-4
                    rounded-2xl
                    border
                    bg-white
                    outline-none

                    focus:ring-2
                    focus:ring-blue-500/20
                    focus:border-blue-500
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
