import { supabase } from '../supabase'

export async function getPengeluaranKategori() {
    const { data, error } = await supabase
        .from('pengeluaran_kategori')
        .select('id, nama')
        .order('urutan')

    if (error) throw error
    return data || []
}