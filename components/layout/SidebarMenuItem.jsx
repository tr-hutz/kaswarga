'use client'

import Link from 'next/link'

export default function SidebarMenuItem({

                                            item,
                                            active,
                                            onClick

                                        }) {

    const Icon =
        item.icon

    return (

        <Link

            href={item.href}

            onClick={onClick}

            className={`
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-xl
                transition

                ${active

                ? `
                        bg-blue-50
                        text-blue-700
                        font-medium
                    `

                : `
                        hover:bg-gray-100
                    `
            }
            `}
        >

            <Icon
                size={18}
            />

            <span>

                {item.label}

            </span>

        </Link>
    )
}