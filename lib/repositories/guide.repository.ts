import { supabaseAdmin } from '@/lib/supabase-admin'

export interface GuideSection {
    id:           string
    category:     string
    position:     number
    is_published: boolean
    target_roles: string[] | null
    created_at:   string
    updated_at:   string
}

export interface GuideTranslation {
    id:         string
    section_id: string
    locale:     string
    title:      string
    body:       string
}

export interface GuideRow extends GuideSection {
    title:  string
    body:   string
    locale: string
}

export interface GuideAdminRow extends GuideSection {
    translations: GuideTranslation[]
}

/** Published sections for authenticated users — filtered by role, with locale fallback to 'id' */
export async function findPublishedSections(locale: string, roleCode: string): Promise<GuideRow[]> {
    const { data: sections, error: secErr } = await supabaseAdmin
        .from('guide_sections')
        .select('id, category, position, is_published, target_roles, created_at, updated_at')
        .eq('is_published', true)
        .order('category')
        .order('position')
    if (secErr) throw new Error(secErr.message)

    const allSections = (sections ?? []) as GuideSection[]

    const visible = allSections.filter(s =>
        !s.target_roles || s.target_roles.length === 0 || s.target_roles.includes(roleCode)
    )
    if (visible.length === 0) return []

    const ids = visible.map(s => s.id)

    const { data: translations, error: transErr } = await supabaseAdmin
        .from('guide_section_translations')
        .select('section_id, locale, title, body')
        .in('section_id', ids)
        .in('locale', locale !== 'id' ? [locale, 'id'] : ['id'])
    if (transErr) throw new Error(transErr.message)

    const transMap = new Map<string, { locale: string; title: string; body: string }>()
    for (const t of (translations ?? []) as { section_id: string; locale: string; title: string; body: string }[]) {
        const existing = transMap.get(t.section_id)
        if (!existing || (t.locale === locale && existing.locale !== locale)) {
            transMap.set(t.section_id, { locale: t.locale, title: t.title, body: t.body })
        }
    }

    return visible
        .map(s => {
            const trans = transMap.get(s.id)
            if (!trans) return null
            return { ...s, title: trans.title, body: trans.body, locale: trans.locale }
        })
        .filter((r): r is GuideRow => r !== null)
}

/** All sections with all translations — Super Admin only */
export async function findAllSectionsWithTranslations(): Promise<GuideAdminRow[]> {
    const { data: sections, error: secErr } = await supabaseAdmin
        .from('guide_sections')
        .select('id, category, position, is_published, target_roles, created_at, updated_at')
        .order('category')
        .order('position')
    if (secErr) throw new Error(secErr.message)

    const allSections = (sections ?? []) as GuideSection[]
    if (allSections.length === 0) return []

    const ids = allSections.map(s => s.id)
    const { data: translations, error: transErr } = await supabaseAdmin
        .from('guide_section_translations')
        .select('id, section_id, locale, title, body')
        .in('section_id', ids)
    if (transErr) throw new Error(transErr.message)

    const transMap = new Map<string, GuideTranslation[]>()
    for (const t of (translations ?? []) as GuideTranslation[]) {
        const arr = transMap.get(t.section_id) ?? []
        arr.push(t)
        transMap.set(t.section_id, arr)
    }

    return allSections.map(s => ({ ...s, translations: transMap.get(s.id) ?? [] }))
}

export async function createSection(payload: {
    category:     string
    position:     number
    is_published: boolean
    target_roles: string[] | null
    created_by:   string
    locale:       string
    title:        string
    body:         string
}): Promise<GuideAdminRow> {
    const { locale, title, body, ...sectionPayload } = payload
    const { data, error } = await supabaseAdmin
        .from('guide_sections')
        .insert(sectionPayload)
        .select()
        .single()
    if (error) throw new Error(error.message)
    const section = data as GuideSection

    const { data: trans, error: transErr } = await supabaseAdmin
        .from('guide_section_translations')
        .insert({ section_id: section.id, locale, title, body })
        .select()
        .single()
    if (transErr) throw new Error(transErr.message)

    return { ...section, translations: [trans as GuideTranslation] }
}

export async function updateSection(id: string, payload: {
    category?:     string
    position?:     number
    is_published?: boolean
    target_roles?: string[] | null
    updated_by:    string
    locale:        string
    title?:        string
    body?:         string
}): Promise<GuideAdminRow> {
    const { locale, title, body, updated_by, ...sectionPayload } = payload
    const now = new Date().toISOString()

    const { error: secErr } = await supabaseAdmin
        .from('guide_sections')
        .update({ ...sectionPayload, updated_by, updated_at: now })
        .eq('id', id)
    if (secErr) throw new Error(secErr.message)

    if (title !== undefined || body !== undefined) {
        const { error: transErr } = await supabaseAdmin
            .from('guide_section_translations')
            .upsert(
                { section_id: id, locale, title: title ?? '', body: body ?? '', updated_at: now },
                { onConflict: 'section_id,locale' }
            )
        if (transErr) throw new Error(transErr.message)
    }

    const rows = await findAllSectionsWithTranslations()
    const updated = rows.find(r => r.id === id)
    if (!updated) throw new Error('Section not found after update')
    return updated
}

export async function deleteSection(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('guide_sections').delete().eq('id', id)
    if (error) throw new Error(error.message)
}

export async function upsertTranslation(
    sectionId: string,
    locale:    string,
    title:     string,
    body:      string
): Promise<GuideTranslation> {
    const { data, error } = await supabaseAdmin
        .from('guide_section_translations')
        .upsert(
            { section_id: sectionId, locale, title, body, updated_at: new Date().toISOString() },
            { onConflict: 'section_id,locale' }
        )
        .select()
        .single()
    if (error) throw new Error(error.message)
    return data as GuideTranslation
}
