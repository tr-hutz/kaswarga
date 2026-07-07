// @ts-nocheck
'use client'

import {
    Search
} from 'lucide-react'

export default function ToolbarSearch({

                                          value,
                                          onChange,

                                          placeholder =
                                          'Cari...'

                                      }) {

    return (

        <div
            className="
                relative
                w-full

                sm:w-72
            "
        >

            <Search
                size={16}
                className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                "
            />

            <input

                value={value}

                onChange={(e) =>
                    onChange(
                        e.target.value
                    )
                }

                placeholder={placeholder}

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
            />

        </div>
    )
}