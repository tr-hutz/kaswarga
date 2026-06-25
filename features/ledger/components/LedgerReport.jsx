'use client'

import {
    useState
} from 'react'

import {
    FileText,
    Loader2
} from 'lucide-react'

export default function LedgerReport() {

    const currentYear =
        new Date().getFullYear()

    const [
        tahun,
        setTahun
    ] = useState(currentYear)

    const [
        loading,
        setLoading
    ] = useState(false)

    const YEARS = [
        currentYear - 2,
        currentYear - 1,
        currentYear,
        currentYear + 1
    ]

    async function handleGenerate() {

        setLoading(true)

        try {

            const res =
                await fetch(
                    `/api/ledger/laporan?tahun=${tahun}`
                )

            if (!res.ok) {
                throw new Error(
                    'Gagal membuat laporan'
                )
            }

            const disposition =
                res.headers.get(
                    'Content-Disposition'
                )

            const match =
                disposition?.match(
                    /filename="?([^"]+)"?/
                )

            const filename =
                match?.[1] ||
                `laporan-kas-${tahun}.pdf`

            const blob =
                await res.blob()

            const url =
                URL.createObjectURL(
                    blob
                )

            const a =
                document.createElement(
                    'a'
                )

            a.href = url
            a.download = filename

            a.click()

            URL.revokeObjectURL(url)

        } catch (err) {

            console.error(err)

        } finally {

            setLoading(false)

        }
    }

    return (

        <div
            className="
                bg-white
                rounded-2xl
                border
                p-4
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-4
            "
        >

            <div>

                <div
                    className="
                        font-semibold
                        text-sm
                    "
                >
                    Laporan Arus Kas
                </div>

                <div
                    className="
                        text-xs
                        text-slate-500
                        mt-0.5
                    "
                >
                    Generate laporan kas tahunan dalam format PDF
                </div>

            </div>

            <div
                className="
                    flex
                    items-center
                    gap-2
                "
            >

                <select
                    value={tahun}
                    onChange={e =>
                        setTahun(
                            Number(e.target.value)
                        )
                    }
                    className="
                        border
                        rounded-xl
                        px-3
                        py-2
                        text-sm
                        outline-none
                        focus:ring-2
                        focus:ring-blue-500/20
                        focus:border-blue-500
                    "
                >

                    {YEARS.map(y => (

                        <option
                            key={y}
                            value={y}
                        >
                            {y}
                        </option>

                    ))}

                </select>

                <button

                    onClick={handleGenerate}

                    disabled={loading}

                    className="
                        flex
                        items-center
                        gap-2
                        bg-blue-600
                        hover:bg-blue-700
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        text-white
                        rounded-xl
                        px-4
                        py-2
                        text-sm
                        transition
                    "
                >

                    {loading
                        ? <Loader2
                            className="
                                w-4
                                h-4
                                animate-spin
                            "
                          />
                        : <FileText
                            className="
                                w-4
                                h-4
                            "
                          />
                    }

                    {loading
                        ? 'Membuat...'
                        : 'Generate PDF'
                    }

                </button>

            </div>

        </div>
    )
}
