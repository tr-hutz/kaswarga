import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Database }  from '@/types/database'

type GuideRow    = Database['public']['Tables']['guide_sections']['Row']
type GuideInsert = Database['public']['Tables']['guide_sections']['Insert']
type GuideUpdate = Database['public']['Tables']['guide_sections']['Update']

export type { GuideRow }

export async function listPublishedSections(): Promise<GuideRow[]> {
    const { data, error } = await supabaseAdmin
        .from('guide_sections')
        .select('*')
        .eq('is_published', true)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) throw error
    return (data as GuideRow[]) ?? []
}

export async function listAllSections(): Promise<GuideRow[]> {
    const { data, error } = await supabaseAdmin
        .from('guide_sections')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) throw error
    return (data as GuideRow[]) ?? []
}

export async function findSectionById(id: string): Promise<GuideRow | null> {
    const { data, error } = await supabaseAdmin
        .from('guide_sections')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) throw error
    return (data as GuideRow | null)
}

export async function insertSection(payload: GuideInsert): Promise<GuideRow> {
    const { data, error } = await supabaseAdmin
        .from('guide_sections')
        .insert(payload)
        .select('*')
        .single()

    if (error) throw error
    return data as GuideRow
}

export async function updateSectionById(id: string, payload: GuideUpdate): Promise<GuideRow> {
    const { data, error } = await supabaseAdmin
        .from('guide_sections')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()

    if (error) throw error
    return data as GuideRow
}

export async function deleteSectionById(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('guide_sections')
        .delete()
        .eq('id', id)

    if (error) throw error
}
