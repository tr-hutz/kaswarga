'use client'

import {
    useEffect,
    useState
} from 'react'

import {

    createWarga,
    updateWarga

} from '@/lib/services/warga.service'

export default function WargaForm({

                                      open,
                                      onClose,

                                      warga,

                                      onSuccess

                                  }) {

    const isEdit =
        !!warga

    const [

        form,
        setForm

    ] = useState({

        nama: '',
        blok: '',
        noRumah: '',
        noHp: ''

    })

    useEffect(() => {

        if (!warga) {

            setForm({

                nama: '',
                blok: '',
                noRumah: '',
                noHp: ''

            })

            return
        }

        setForm({

            nama:
                warga.nama || '',

            blok:
                warga.blok || '',

            noRumah:
                warga.noRumah || '',

            noHp:
                warga.noHp || ''

        })

    }, [warga])

    async function handleSubmit(
        e
    ) {

        e.preventDefault()

        try {

            if (isEdit) {

                await updateWarga(
                    warga.id,
                    form
                )

            } else {

                await createWarga(
                    form
                )
            }

            onSuccess()

        } catch (err) {

            console.error(err)

            alert(
                'Gagal menyimpan warga'
            )
        }
    }

    if (!open) {
        return null
    }

    return (

        <div
            className="
        fixed
        inset-0
        bg-black/40
        flex
        items-center
        justify-center
        z-50
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

                    {
                        isEdit
                            ? 'Edit Warga'
                            : 'Tambah Warga'
                    }

                </h2>

                <input
                    placeholder="Nama"
                    value={form.nama}
                    onChange={e =>
                        setForm({
                            ...form,
                            nama:
                            e.target.value
                        })
                    }
                    className="
            w-full
            border
            rounded-xl
            px-4
            py-3
          "
                />

                <input
                    placeholder="Blok"
                    value={form.blok}
                    onChange={e =>
                        setForm({
                            ...form,
                            blok:
                            e.target.value
                        })
                    }
                    className="
            w-full
            border
            rounded-xl
            px-4
            py-3
          "
                />

                <input
                    placeholder="No Rumah"
                    value={form.noRumah}
                    onChange={e =>
                        setForm({
                            ...form,
                            noRumah:
                            e.target.value
                        })
                    }
                    className="
            w-full
            border
            rounded-xl
            px-4
            py-3
          "
                />

                <input
                    placeholder="No HP"
                    value={form.noHp}
                    onChange={e =>
                        setForm({
                            ...form,
                            noHp:
                            e.target.value
                        })
                    }
                    className="
            w-full
            border
            rounded-xl
            px-4
            py-3
          "
                />

                <div
                    className="
            flex
            justify-end
            gap-2
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