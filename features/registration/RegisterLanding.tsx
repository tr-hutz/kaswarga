// @ts-nocheck
'use client'

import Link from 'next/link'
import { Building2, Users } from 'lucide-react'

export default function RegisterLanding() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md space-y-6">

                <div className="text-center">
                    <h1 className="text-2xl font-bold">Daftar ke Kaswarga</h1>
                    <p className="text-sm text-gray-500 mt-2">Pilih jenis pendaftaran</p>
                </div>

                <div className="grid gap-4">

                    <Link href="/daftar/rt" className="block">
                        <div className="bg-white border rounded-2xl p-6 hover:shadow-md transition cursor-pointer">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Daftarkan RT Baru</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Untuk RT yang belum terdaftar di Kaswarga. Pendaftaran akan diverifikasi oleh super admin.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/daftar/warga" className="block">
                        <div className="bg-white border rounded-2xl p-6 hover:shadow-md transition cursor-pointer">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Daftar sebagai Warga</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Untuk warga yang ingin bergabung ke RT yang sudah terdaftar. Butuh kode RT dari pengurus.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                </div>

                <p className="text-center text-sm text-gray-500">
                    Sudah punya akun?{' '}
                    <Link href="/login" className="text-blue-600 hover:underline font-medium">
                        Masuk
                    </Link>
                </p>

            </div>
        </div>
    )
}
