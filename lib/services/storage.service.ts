'use client'

import { supabase } from '../supabase'

export async function uploadRtAsset(storagePath: string, file: File): Promise<string> {
    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const path = `${storagePath}.${ext}`

    const { error } = await supabase.storage
        .from('rt-assets')
        .upload(path, file, { upsert: true })

    if (error) throw error

    const { data } = supabase.storage.from('rt-assets').getPublicUrl(path)
    return `${data.publicUrl}?t=${Date.now()}`
}
