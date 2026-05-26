'use client'

import {
    useState
} from 'react'

import {
    approvePembayaran
} from '../../services/pembayaran-actions'

export default function ApproveDialog({

                                          open,
                                          onClose,

                                          konfirmasi,

                                          onSuccess

                                      }) {

    const [
        loading,
        setLoading
    ] = useState(false)

    if (
        !open ||
        !konfirmasi
    ) {
        return null
    }

    async function handleApprove() {

        setLoading(true)

        try {

            await approvePembayaran(
                konfirmasi.id
            )

            await onSuccess?.()

            onClose?.()

        } catch (err) {

            console.error(err)

            alert(
                'Gagal menyetujui pembayaran'
            )

        } finally {

            setLoading(false)
        }
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

            <div
                className="
          bg-white
          rounded-2xl
          p-6
          w-full
          max-w-md
          space-y-5
        "
            >

                <div>

                    <h2
                        className="
              text-xl
              font-bold
            "
                    >
                        Approve Pembayaran
                    </h2>

                    <p
                        className="
              text-sm
              text-slate-500
              mt-1
            "
                    >
                        Apakah pembayaran ini
                        ingin disetujui?
                    </p>

                </div>

                <div
                    className="
            rounded-xl
            border
            p-4
            bg-slate-50
            text-sm
            space-y-2
          "
                >

                    <div>
                        Tahun:
                        {' '}
                        <strong>
                            {
                                konfirmasi.tahun
                            }
                        </strong>
                    </div>

                    <div>
                        Status:
                        {' '}
                        <strong>
                            {
                                konfirmasi.status
                            }
                        </strong>
                    </div>

                </div>

                <div
                    className="
            flex
            justify-end
            gap-3
          "
                >

                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="
              px-4
              py-2
              rounded-xl
              border
            "
                    >
                        Batal
                    </button>

                    <button
                        onClick={
                            handleApprove
                        }
                        disabled={loading}
                        className="
              px-4
              py-2
              rounded-xl
              bg-green-600
              text-white
            "
                    >

                        {
                            loading
                                ? 'Memproses...'
                                : 'Approve'
                        }

                    </button>

                </div>

            </div>

        </div>
    )
}