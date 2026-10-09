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

export interface GuideFeedback {
    helpful:     number
    not_helpful: number
}

export interface GuideRow extends GuideSection {
    title:  string
    body:   string
    locale: string
}

export interface GuideAdminRow extends GuideSection {
    translations: GuideTranslation[]
    feedback:     GuideFeedback
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const GUIDE_ASSETS_BUCKET = 'guide-assets'

/** Extract Storage file paths from markdown image tags that belong to guide-assets. */
function extractStoragePaths(body: string): string[] {
    const re     = /!\[[^\]]*\]\(([^)]+)\)/g
    const marker = `/object/public/${GUIDE_ASSETS_BUCKET}/`
    const paths: string[] = []
    let m: RegExpExecArray | null
    while ((m = re.exec(body)) !== null) {
        const idx = m[1].indexOf(marker)
        if (idx !== -1) paths.push(m[1].slice(idx + marker.length))
    }
    return paths
}

/**
 * Before saving a new body, compare old body from DB and delete any guide-assets
 * Storage files that are no longer referenced in the new body.
 */
async function purgeRemovedImages(sectionId: string, locale: string, newBody: string) {
    const { data: existing } = await supabaseAdmin
        .from('guide_section_translations')
        .select('body')
        .eq('section_id', sectionId)
        .eq('locale', locale)
        .maybeSingle()
    if (!existing?.body) return

    const oldPaths  = extractStoragePaths(existing.body)
    const newPaths  = new Set(extractStoragePaths(newBody))
    const toDelete  = oldPaths.filter(p => !newPaths.has(p))

    if (toDelete.length > 0) {
        const { error } = await supabaseAdmin.storage.from(GUIDE_ASSETS_BUCKET).remove(toDelete)
        if (error) console.error('[guide] storage cleanup error:', error.message)
    }
}

/** Aggregate helpful / not_helpful counts from guide_section_feedback per section. */
async function fetchFeedbackMap(): Promise<Map<string, GuideFeedback>> {
    // guide_section_feedback is migration 034 — not in generated types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin as any)
        .from('guide_section_feedback')
        .select('section_id, is_helpful')

    const map = new Map<string, GuideFeedback>()
    for (const row of (data ?? []) as { section_id: string; is_helpful: boolean }[]) {
        const c = map.get(row.section_id) ?? { helpful: 0, not_helpful: 0 }
        if (row.is_helpful) { c.helpful++ } else { c.not_helpful++ }
        map.set(row.section_id, c)
    }
    return map
}

const ZERO_FEEDBACK: GuideFeedback = { helpful: 0, not_helpful: 0 }

// ---------------------------------------------------------------------------
// Public read functions
// ---------------------------------------------------------------------------

/** Published sections for authenticated users — filtered by role, with locale fallback to 'id'. */
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

/** All sections with all translations and feedback counts — Super Admin only. */
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

    const [{ data: translations, error: transErr }, feedbackMap] = await Promise.all([
        supabaseAdmin
            .from('guide_section_translations')
            .select('id, section_id, locale, title, body')
            .in('section_id', ids),
        fetchFeedbackMap(),
    ])
    if (transErr) throw new Error(transErr.message)

    const transMap = new Map<string, GuideTranslation[]>()
    for (const t of (translations ?? []) as GuideTranslation[]) {
        const arr = transMap.get(t.section_id) ?? []
        arr.push(t)
        transMap.set(t.section_id, arr)
    }

    return allSections.map(s => ({
        ...s,
        translations: transMap.get(s.id) ?? [],
        feedback:     feedbackMap.get(s.id) ?? ZERO_FEEDBACK,
    }))
}

/** Returns the distinct locales that have at least one published translation. */
export async function findAvailableLocales(): Promise<string[]> {
    const { data, error } = await supabaseAdmin
        .from('guide_section_translations')
        .select('locale, guide_sections!inner(is_published)')
        .eq('guide_sections.is_published', true)
    if (error) throw new Error(error.message)
    const locales = [...new Set((data ?? []).map((r: { locale: string }) => r.locale))]
    return locales.sort()
}

// ---------------------------------------------------------------------------
// Mutation functions
// ---------------------------------------------------------------------------

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

    return { ...section, translations: [trans as GuideTranslation], feedback: ZERO_FEEDBACK }
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
        // Cleanup Storage images removed from the body before overwriting
        if (body !== undefined) await purgeRemovedImages(id, locale, body)

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
    // Delete all guide-assets Storage images referenced by any translation of this section
    const { data: translations } = await supabaseAdmin
        .from('guide_section_translations')
        .select('body')
        .eq('section_id', id)

    const allPaths = (translations ?? []).flatMap((t: { body: string }) => extractStoragePaths(t.body))
    if (allPaths.length > 0) {
        await supabaseAdmin.storage.from(GUIDE_ASSETS_BUCKET).remove(allPaths)
    }

    const { error } = await supabaseAdmin.from('guide_sections').delete().eq('id', id)
    if (error) throw new Error(error.message)
}

export async function upsertTranslation(
    sectionId: string,
    locale:    string,
    title:     string,
    body:      string
): Promise<GuideTranslation> {
    // Cleanup Storage images removed from the body before overwriting
    await purgeRemovedImages(sectionId, locale, body)

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
