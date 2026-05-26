'use client'

export default function PaymentSearch({search, setSearch}) {
    return (
        <input
            type="text"
            value={search}
            onChange={e =>
                setSearch(
                    e.target.value
                )
            }
            placeholder="Cari nama warga..."
            className="w-full xl:w-[320px] border rounded-xl px-4 py-2"
        />
    )
}