import { describe, it, expect, vi } from 'vitest'
import { residentImportDefinition } from '@/lib/import/definitions/resident.definition'
import type { RawRow, ImportContext } from '@/lib/import/types'

vi.mock('@/lib/supabase-admin', () => ({
    supabaseAdmin: {
        from: vi.fn().mockReturnValue({
            select:     vi.fn().mockReturnThis(),
            eq:         vi.fn().mockReturnThis(),
            insert:     vi.fn().mockReturnThis(),
            single:     vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: (resolve: (v: unknown) => unknown) =>
                Promise.resolve({ data: [], error: null }).then(resolve),
        }),
    },
}))

function makeCtx(dbKeys: string[] = [], fileKeys: string[] = []) {
    return {
        jobId:    'j-1',
        rtId:     'rt-1',
        userId:   'u-1',
        dbKeys:   new Set<string>(dbKeys),
        fileKeys: new Set<string>(fileKeys),
    }
}

/* -------------------------------------------------------------------------- */
/* validateRow                                                                 */
/* -------------------------------------------------------------------------- */

describe('residentImportDefinition.validateRow', () => {
    it('invalid — missing name (empty string)', () => {
        const result = residentImportDefinition.validateRow(
            { name: '' } as RawRow,
            makeCtx() as unknown as ImportContext,
        )
        expect(result.valid).toBe(false)
        expect(result.errorCode).toBe('MISSING_NAME')
    })

    it('invalid — missing name (undefined)', () => {
        const result = residentImportDefinition.validateRow(
            {} as RawRow,
            makeCtx() as unknown as ImportContext,
        )
        expect(result.valid).toBe(false)
        expect(result.errorCode).toBe('MISSING_NAME')
    })

    it('valid — name present, no phone, no block', () => {
        const result = residentImportDefinition.validateRow(
            { name: 'Budi' } as RawRow,
            makeCtx() as unknown as ImportContext,
        )
        expect(result.valid).toBe(true)
    })

    it('valid — phone with exactly 7 digits', () => {
        const result = residentImportDefinition.validateRow(
            { name: 'A', phone: '0812345' } as RawRow,
            makeCtx() as unknown as ImportContext,
        )
        expect(result.valid).toBe(true)
    })

    it('valid — phone with exactly 15 digits', () => {
        const result = residentImportDefinition.validateRow(
            { name: 'A', phone: '082112345678901' } as RawRow,
            makeCtx() as unknown as ImportContext,
        )
        expect(result.valid).toBe(true)
    })

    it('invalid — phone with 6 digits', () => {
        const result = residentImportDefinition.validateRow(
            { name: 'A', phone: '081234' } as RawRow,
            makeCtx() as unknown as ImportContext,
        )
        expect(result.valid).toBe(false)
        expect(result.errorCode).toBe('INVALID_PHONE')
    })

    it('invalid — phone with 16 digits', () => {
        const result = residentImportDefinition.validateRow(
            { name: 'A', phone: '0821123456789012' } as RawRow,
            makeCtx() as unknown as ImportContext,
        )
        expect(result.valid).toBe(false)
        expect(result.errorCode).toBe('INVALID_PHONE')
    })

    it('skipped — duplicate within file (same block+house_number)', () => {
        const ctx    = makeCtx([], ['a:1'])
        const result = residentImportDefinition.validateRow(
            { name: 'X', block: 'A', house_number: '1' } as RawRow,
            ctx as unknown as ImportContext,
        )
        expect(result.valid).toBe(false)
        expect(result.skipped).toBe(true)
        expect(result.skipReason).toBe('DUPLICATE_IN_FILE')
    })

    it('skipped — resident already exists in DB', () => {
        const ctx    = makeCtx(['b:2'])
        const result = residentImportDefinition.validateRow(
            { name: 'X', block: 'B', house_number: '2' } as RawRow,
            ctx as unknown as ImportContext,
        )
        expect(result.valid).toBe(false)
        expect(result.skipped).toBe(true)
        expect(result.skipReason).toBe('RESIDENT_ALREADY_EXISTS')
    })

    it('valid — adds block+house_number key to fileKeys after passing', () => {
        const ctx    = makeCtx()
        const result = residentImportDefinition.validateRow(
            { name: 'X', block: 'C', house_number: '3' } as RawRow,
            ctx as unknown as ImportContext,
        )
        expect(result.valid).toBe(true)
        expect(ctx.fileKeys.has('c:3')).toBe(true)
    })

    it('valid — no block or house_number: skips dedup check entirely', () => {
        const ctx    = makeCtx(['a:1', 'b:2'])
        const result = residentImportDefinition.validateRow(
            { name: 'X' } as RawRow,
            ctx as unknown as ImportContext,
        )
        expect(result.valid).toBe(true)
    })
})

/* -------------------------------------------------------------------------- */
/* transform                                                                   */
/* -------------------------------------------------------------------------- */

describe('residentImportDefinition.transform', () => {
    it('maps all fields including rt_id from context', () => {
        const ctx    = { jobId: 'j-1', rtId: 'rt-42', userId: 'u-1' } as ImportContext
        const result = residentImportDefinition.transform(
            { name: 'Budi Santoso', block: 'A', house_number: '1', phone: '08123' },
            ctx,
        )
        expect(result).toEqual({
            rt_id:        'rt-42',
            name:         'Budi Santoso',
            block:        'A',
            house_number: '1',
            phone:        '08123',
            active:       true,
        })
    })

    it('trims whitespace from all string fields', () => {
        const ctx    = { jobId: 'j-1', rtId: 'rt-1', userId: 'u-1' } as ImportContext
        const result = residentImportDefinition.transform(
            { name: '  Budi  ', block: ' A ', house_number: ' 1 ', phone: ' 081 ' },
            ctx,
        )
        expect(result).toMatchObject({
            name:         'Budi',
            block:        'A',
            house_number: '1',
            phone:        '081',
        })
    })

    it('sets null for empty optional fields', () => {
        const ctx    = { jobId: 'j-1', rtId: 'rt-1', userId: 'u-1' } as ImportContext
        const result = residentImportDefinition.transform(
            { name: 'Budi', block: '', house_number: '', phone: '' },
            ctx,
        )
        expect(result).toMatchObject({
            block:        null,
            house_number: null,
            phone:        null,
        })
    })
})
