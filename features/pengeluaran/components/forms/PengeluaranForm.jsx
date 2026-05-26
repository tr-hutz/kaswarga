'use client'

import {
    useEffect,
    useState
} from 'react'

export default function PengeluaranForm({

                                            open,
                                            onClose,

                                            onSubmit,

                                            initialData = null

                                        }) {

    const [

        form,
        setForm

    ] = useState({

        kategori: '',
        nominal: '',
        tanggal: '',
        deskripsi: '',
        notaUrl: ''

    })

    /*
     |-------------------------------------------------------------
     | HYDRATE
     |-------------------------------------------------------------
     */

    useEffect(() => {

        if (!initialData) {
            return
        }

        setForm({

            kategori:
                initialData.kategori || '',

            nominal:
                initialData.nominal || '',

            tanggal:
                initialData.tanggal || '',

            deskripsi:
                initialData.deskripsi || '',

            notaUrl:
                initialData.notaUrl || ''

        })

    }, [initialData])

    if (!open) {
        return null
    }

    async function handleSubmit(
        e
    ) {

        e.preventDefault()

        await onSubmit(form)
    }

    return (

        <div
            className="
        fixed
        inset-0
        bg-black/40
        z-50
        flex
        items-center
        justify-center
      "
        >

            <form

                onSubmit={handleSubmit}

                className="
          bg-white
          rounded-2xl
          p-6
          w-full
          max-w-lg
          space-y-4
        "
            >

                <h2
                    className="
            text-lg
            font-semibold
          "
                >
                    Form Pengeluaran
                </h2>

                <input

                    value={form.kategori}

                    onChange={e =>
                        setForm({
                            ...form,
                            kategori:
                            e.target.value
                        })
                    }

                    placeholder="Kategori"

                    className="
            w-full
            border
            rounded-xl
            px-4
            py-2
          "
                />

                <input

                    type="number"

                    value={form.nominal}

                    onChange={e =>
                        setForm({
                            ...form,
                            nominal:
                            e.target.value
                        })
                    }

                    placeholder="Nominal"

                    className="
            w-full
            border
            rounded-xl
            px-4
            py-2
          "
                />

                <input

                    type="date"

                    value={form.tanggal}

                    onChange={e =>
                        setForm({
                            ...form,
                            tanggal:
                            e.target.value
                        })
                    }

                    className="
            w-full
            border
            rounded-xl
            px-4
            py-2
          "
                />

                <textarea

                    value={form.deskripsi}

                    onChange={e =>
                        setForm({
                            ...form,
                            deskripsi:
                            e.target.value
                        })
                    }

                    placeholder="Deskripsi"

                    rows={4}

                    className="
            w-full
            border
            rounded-xl
            px-4
            py-2
          "
                />

                <input

                    value={form.notaUrl}

                    onChange={e =>
                        setForm({
                            ...form,
                            notaUrl:
                            e.target.value
                        })
                    }

                    placeholder="URL Nota"

                    className="
            w-full
            border
            rounded-xl
            px-4
            py-2
          "
                />

                <div
                    className="
            flex
            justify-end
            gap-3
          "
                >

                    <button

                        type="button"

                        onClick={onClose}

                        className="
              border
              rounded-xl
              px-4
              py-2
            "
                    >

                        Batal

                    </button>

                    <button

                        type="submit"

                        className="
              bg-black
              text-white
              rounded-xl
              px-4
              py-2
            "
                    >

                        Simpan

                    </button>

                </div>

            </form>

        </div>
    )
}