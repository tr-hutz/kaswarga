import { ForbiddenError }    from '@/lib/auth/errors'
import type { AuthorizationContext } from '@/lib/auth/authorization-context'
import {
    listPublishedSections,
    listAllSections,
    findSectionById,
    insertSection,
    updateSectionById,
    deleteSectionById,
    type GuideRow,
} from '@/lib/repositories/guide.repository'

export type { GuideRow }

export interface GuideSectionPayload {
    title:        string
    body:         string
    category:     string
    position:     number
    is_published: boolean
}

function requireSuperAdmin(auth: AuthorizationContext) {
    if (auth.roleCode !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Super Admin only')
    }
}

export async function getPublishedSections(): Promise<GuideRow[]> {
    return listPublishedSections()
}

export async function getAllSections(auth: AuthorizationContext): Promise<GuideRow[]> {
    requireSuperAdmin(auth)
    return listAllSections()
}

export async function createSection(
    payload: GuideSectionPayload,
    auth: AuthorizationContext,
): Promise<GuideRow> {
    requireSuperAdmin(auth)
    return insertSection({
        title:        payload.title.trim(),
        body:         payload.body,
        category:     payload.category,
        position:     payload.position,
        is_published: payload.is_published,
        created_by:   auth.userId,
        updated_by:   auth.userId,
    })
}

export async function updateSection(
    id: string,
    payload: Partial<GuideSectionPayload>,
    auth: AuthorizationContext,
): Promise<GuideRow> {
    requireSuperAdmin(auth)
    const existing = await findSectionById(id)
    if (!existing) throw new Error('Guide section not found')
    return updateSectionById(id, {
        ...payload,
        title:      payload.title?.trim() ?? existing.title,
        updated_by: auth.userId,
    })
}

export async function deleteSection(
    id: string,
    auth: AuthorizationContext,
): Promise<void> {
    requireSuperAdmin(auth)
    const existing = await findSectionById(id)
    if (!existing) throw new Error('Guide section not found')
    return deleteSectionById(id)
}
