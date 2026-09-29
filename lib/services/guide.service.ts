import {
    findPublishedSections,
    findAllSectionsWithTranslations,
    findAvailableLocales,
    createSection,
    updateSection,
    deleteSection,
    upsertTranslation,
    type GuideRow,
    type GuideAdminRow,
    type GuideTranslation,
} from '@/lib/repositories/guide.repository'
import type { AuthorizationContext } from '@/lib/auth/authorization-context'

export type { GuideRow, GuideAdminRow, GuideTranslation }

const SUPER_ADMIN_CODE = 'SUPER_ADMIN'

function requireSuperAdmin(auth: AuthorizationContext) {
    if (auth.roleCode !== SUPER_ADMIN_CODE) throw new Error('Forbidden')
}

export async function getAvailableLocales(): Promise<string[]> {
    return findAvailableLocales()
}

export async function getPublishedSections(locale: string, auth: AuthorizationContext): Promise<GuideRow[]> {
    return findPublishedSections(locale, auth.roleCode)
}

export async function getAllSections(auth: AuthorizationContext): Promise<GuideAdminRow[]> {
    requireSuperAdmin(auth)
    return findAllSectionsWithTranslations()
}

export async function addSection(
    payload: {
        category:     string
        position:     number
        is_published: boolean
        target_roles: string[] | null
        locale:       string
        title:        string
        body:         string
    },
    auth: AuthorizationContext
): Promise<GuideAdminRow> {
    requireSuperAdmin(auth)
    return createSection({ ...payload, created_by: auth.userId })
}

export async function editSection(
    id:      string,
    payload: {
        category?:     string
        position?:     number
        is_published?: boolean
        target_roles?: string[] | null
        locale:        string
        title?:        string
        body?:         string
    },
    auth: AuthorizationContext
): Promise<GuideAdminRow> {
    requireSuperAdmin(auth)
    return updateSection(id, { ...payload, updated_by: auth.userId })
}

export async function addTranslation(
    sectionId: string,
    locale:    string,
    title:     string,
    body:      string,
    auth:      AuthorizationContext
): Promise<GuideTranslation> {
    requireSuperAdmin(auth)
    return upsertTranslation(sectionId, locale, title, body)
}

export async function removeSection(id: string, auth: AuthorizationContext): Promise<void> {
    requireSuperAdmin(auth)
    return deleteSection(id)
}
