// @ts-nocheck
'use client'

import PaymentSearch from './PaymentSearch'

export default function PaymentToolbar({year, setYear, search, setSearch}) {
    return (

        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            <PaymentSearch
                search={search}
                setSearch={setSearch}
            />

            <select
                value={year}
                onChange={e =>
                    setYear(
                        Number(
                            e.target.value
                        )
                    )
                }
                className="border rounded-xl px-4 py-2">

                {[
                    year - 1,
                    year,
                    year + 1
                ].map(item => (

                    <option
                        key={item}
                        value={item}
                    >
                        {item}
                    </option>

                ))}

            </select>

        </div>
    )
}