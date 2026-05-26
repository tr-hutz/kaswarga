'use client'

import {
    useState
} from 'react'

import {
    rejectPembayaran
} from '../../services/pembayaran-actions'

export default function RejectDialog({

                                         open,
                                         onClose,

                                         konfirmasi,

                                         onSuccess

                                     }) {

    const [
        loading,
        setLoading
    ] = useState(false)

    const [
        alasan,
        setAlasan
    ] = useState('')

    if (
        !open ||
        !konfirmasi
    ) {
        return null
    }

    async function handleReject() {

        setLoading(true)

        try {

            await rejectPembayaran(
                konfirmasi.id,
                alasan
            )

            await onSuccess?.()

            onClose?.()

        } catch (err) {

            console.error(err)

            alert(
                'Gagal menolak pembayaran'
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
                        Reject Pembayaran
                    </h2>

                </div>

                <textarea
                    value={alasan}
                    onChange={e =>
                        setAlasan(
                            e.target.value
                        )
                    }
                    placeholder="
            Alasan penolakan
          "
                    rows={4}
                    className="
            w-full
            border
            rounded-xl
            p-3
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
                            handleReject
                        }
                        disabled={loading}
                        className="
              px-4
              py-2
              rounded-xl
              bg-red-600
              text-white
            "
                    >

                        {
                            loading
                                ? 'Memproses...'
                                : 'Reject'
                        }

                    </button>

                </div>

            </div>

        </div>
    )
}