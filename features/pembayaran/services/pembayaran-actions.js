import supabase
    from '../../../lib/supabase'

export async function approvePembayaran(

    konfirmasiId

) {

    const {
        error
    } = await supabase.rpc(
        'approve_konfirmasi',
        {
            p_konfirmasi_id:
            konfirmasiId
        }
    )

    if (error) {

        throw error
    }
}

export async function rejectPembayaran(

    konfirmasiId

) {

    const {
        error
    } = await supabase.rpc(
        'reject_konfirmasi',
        {
            p_konfirmasi_id:
            konfirmasiId
        }
    )

    if (error) {

        throw error
    }
}