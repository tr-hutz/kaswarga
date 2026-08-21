/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    createImportJob,
    processImportJob,
    confirmImportJob,
    cancelImportJob,
    approveImportBatch,
    rejectImportBatch,
} from '@/lib/import/engine'
import {
    IMPORT_STATUS,
    IMPORT_TYPE,
    APPROVAL_POLICY,
    IMPORT_ROW_STATUS,
    type ImportJob,
    type ImportJobRow,
    type RawRow,
    type ApprovalPolicy,
} from '@/lib/import/types'
import { ImportStatusError } from '@/lib/import/errors'

/* -------------------------------------------------------------------------- */
/* Supabase mock                                                               */
/* -------------------------------------------------------------------------- */

const mockFrom = vi.hoisted(() => vi.fn())
const mockRpc  = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase-admin', () => ({
    supabaseAdmin: { from: mockFrom, rpc: mockRpc },
}))

const success = { data: null, error: null }

function makeChain(
    awaitResult:  { data: unknown; error: unknown } = success,
    singleResult?: { data: unknown; error: unknown },
) {
    const chain: Record<string, any> = {}
    for (const m of ['select', 'update', 'insert', 'delete', 'upsert', 'eq', 'neq', 'in', 'is', 'not', 'limit', 'order', 'range', 'filter']) {
        chain[m] = vi.fn().mockReturnValue(chain)
    }
    chain.single      = vi.fn().mockResolvedValue(singleResult ?? success)
    chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    chain.then = (
        resolve: (v: unknown) => unknown,
        reject:  (r: unknown) => unknown,
    ) => Promise.resolve(awaitResult).then(resolve, reject)
    return chain
}

/* -------------------------------------------------------------------------- */
/* Test factories                                                              */
/* -------------------------------------------------------------------------- */

function makeJob(overrides: Partial<ImportJob> = {}): ImportJob {
    return {
        id:               'job-1',
        rt_id:            'rt-1',
        import_type:      IMPORT_TYPE.EXPENSE,
        status:           IMPORT_STATUS.STAGED,
        filename:         'test.xlsx',
        file_size:        null,
        file_type:        null,
        file_path:        null,
        total_rows:       3,
        processed_rows:   3,
        success_rows:     2,
        failed_rows:      1,
        progress_percent: 100,
        created_by:       'user-creator',
        confirmed_by:     null,
        confirmed_at:     null,
        approved_by:      null,
        rejected_by:      null,
        rejection_reason: null,
        started_at:       null,
        completed_at:     null,
        approved_at:      null,
        created_at:       '2024-01-01T00:00:00Z',
        updated_at:       '2024-01-01T00:00:00Z',
        ...overrides,
    }
}

function makeJobRow(overrides: Partial<ImportJobRow> = {}): ImportJobRow {
    return {
        id:            'row-1',
        import_job_id: 'job-1',
        row_number:    2,
        status:        IMPORT_ROW_STATUS.VALID,
        raw_data:      { name: 'Budi', amount: '50000' },
        error_code:    null,
        error_message: null,
        created_at:    '2024-01-01T00:00:00Z',
        ...overrides,
    }
}

function makeDef(policy: ApprovalPolicy = APPROVAL_POLICY.NONE): any {
    return {
        type:              IMPORT_TYPE.RESIDENT,
        importPermission:  'resident.import',
        approvePermission: null,
        approvalPolicy:    policy,
        columns:           [],
        template:          { columnAliases: {}, sampleRows: [], sheetName: 'S', fileName: 'f.xlsx' },
        validateRow:  vi.fn().mockReturnValue({ valid: true }),
        transform:    vi.fn().mockImplementation((row: RawRow) => row),
        persist:      vi.fn().mockResolvedValue({ inserted: 1, skipped: 0 }),
        preload:      vi.fn().mockResolvedValue({}),
    }
}

/* -------------------------------------------------------------------------- */
/* Setup                                                                       */
/* -------------------------------------------------------------------------- */

beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockImplementation(() => makeChain(success))
    mockRpc.mockResolvedValue({ data: null, error: null })
})

/* -------------------------------------------------------------------------- */
/* createImportJob                                                             */
/* -------------------------------------------------------------------------- */

describe('createImportJob', () => {
    it('inserts the job and returns the job ID', async () => {
        mockFrom.mockReturnValueOnce(makeChain(success, { data: { id: 'new-job-id' }, error: null }))

        const result = await createImportJob({
            rtId:     'rt-1',
            userId:   'user-1',
            type:     IMPORT_TYPE.EXPENSE,
            filename: 'test.xlsx',
            fileSize: 1024,
            fileType: 'xlsx',
            rowCount: 10,
        })

        expect(result).toBe('new-job-id')
    })
})

/* -------------------------------------------------------------------------- */
/* processImportJob                                                            */
/* -------------------------------------------------------------------------- */

describe('processImportJob', () => {
    it('NONE policy — calls persist() with all valid rows', async () => {
        const def  = makeDef(APPROVAL_POLICY.NONE)
        const rows = [{ name: 'A' }, { name: 'B' }, { name: 'C' }] as RawRow[]

        await processImportJob('job-1', rows, def, 'rt-1', 'user-1')

        expect(def.persist).toHaveBeenCalledTimes(1)
        expect(def.persist).toHaveBeenCalledWith(rows, expect.objectContaining({ jobId: 'job-1' }))
    })

    it('NONE policy — filters out invalid rows before calling persist()', async () => {
        const def  = makeDef(APPROVAL_POLICY.NONE)
        const rows = [{ name: 'A' }, { name: 'B' }, { name: 'bad' }] as RawRow[]
        def.validateRow
            .mockReturnValueOnce({ valid: true })
            .mockReturnValueOnce({ valid: true })
            .mockReturnValueOnce({ valid: false, errorCode: 'VALIDATION_FAILED' })

        await processImportJob('job-1', rows, def, 'rt-1', 'user-1')

        expect(def.persist).toHaveBeenCalledWith([rows[0], rows[1]], expect.any(Object))
    })

    it('NONE policy — skips persist() when no valid rows', async () => {
        const def = makeDef(APPROVAL_POLICY.NONE)
        def.validateRow.mockReturnValue({ valid: false, errorCode: 'VALIDATION_FAILED' })

        await processImportJob('job-1', [{ a: '1' }, { a: '2' }] as RawRow[], def, 'rt-1', 'user-1')

        expect(def.persist).not.toHaveBeenCalled()
    })

    it('BATCH policy — does not call persist(), stages rows instead', async () => {
        const def = makeDef(APPROVAL_POLICY.BATCH)

        await processImportJob('job-1', [{ a: '1' }] as RawRow[], def, 'rt-1', 'user-1')

        expect(def.persist).not.toHaveBeenCalled()
    })

    it('NONE policy — does not propagate error when persist() throws', async () => {
        const def = makeDef(APPROVAL_POLICY.NONE)
        def.persist.mockRejectedValue(new Error('persist failed'))

        await expect(
            processImportJob('job-1', [{ a: '1' }] as RawRow[], def, 'rt-1', 'user-1')
        ).resolves.toBeUndefined()
        expect(def.persist).toHaveBeenCalledTimes(1)
    })
})

/* -------------------------------------------------------------------------- */
/* confirmImportJob                                                            */
/* -------------------------------------------------------------------------- */

describe('confirmImportJob', () => {
    it('happy path — calls persist() with fetched valid rows', async () => {
        const job  = makeJob({ status: IMPORT_STATUS.STAGED })
        const rows = [makeJobRow(), makeJobRow({ id: 'row-2', row_number: 3 })]
        const def  = makeDef()

        mockFrom
            .mockReturnValueOnce(makeChain(success, { data: job, error: null }))           // getJob
            .mockReturnValueOnce(makeChain({ data: [{ id: 'job-1' }], error: null }))      // atomic guard
            .mockReturnValueOnce(makeChain({ data: rows, error: null }))                   // fetchAllJobRows

        await confirmImportJob('job-1', 'confirmer-1', def, 'rt-1')

        expect(def.persist).toHaveBeenCalledTimes(1)
    })

    it('throws ImportStatusError when job is not STAGED', async () => {
        const job = makeJob({ status: IMPORT_STATUS.COMPLETED })
        mockFrom.mockReturnValueOnce(makeChain(success, { data: job, error: null }))

        await expect(
            confirmImportJob('job-1', 'confirmer-1', makeDef(), 'rt-1')
        ).rejects.toBeInstanceOf(ImportStatusError)
    })

    it('rolls back to STAGED and re-throws when persist() fails', async () => {
        const job  = makeJob({ status: IMPORT_STATUS.STAGED })
        const rows = [makeJobRow()]
        const def  = makeDef()
        def.persist.mockRejectedValue(new Error('persist failed'))

        mockFrom
            .mockReturnValueOnce(makeChain(success, { data: job, error: null }))           // getJob
            .mockReturnValueOnce(makeChain({ data: [{ id: 'job-1' }], error: null }))      // atomic guard
            .mockReturnValueOnce(makeChain({ data: rows, error: null }))                   // fetchAllJobRows

        await expect(
            confirmImportJob('job-1', 'confirmer-1', def, 'rt-1')
        ).rejects.toThrow('persist failed')
    })
})

/* -------------------------------------------------------------------------- */
/* cancelImportJob                                                             */
/* -------------------------------------------------------------------------- */

describe('cancelImportJob', () => {
    it('happy path — resolves without throwing', async () => {
        const job = makeJob({ status: IMPORT_STATUS.STAGED })
        mockFrom.mockReturnValueOnce(makeChain(success, { data: job, error: null }))

        await expect(cancelImportJob('job-1', 'canceller-1')).resolves.toBeUndefined()
    })

    it('throws ImportStatusError when job is not STAGED', async () => {
        const job = makeJob({ status: IMPORT_STATUS.COMPLETED })
        mockFrom.mockReturnValueOnce(makeChain(success, { data: job, error: null }))

        await expect(cancelImportJob('job-1', 'canceller-1')).rejects.toBeInstanceOf(ImportStatusError)
    })
})

/* -------------------------------------------------------------------------- */
/* approveImportBatch                                                          */
/* -------------------------------------------------------------------------- */

describe('approveImportBatch', () => {
    it('non-EXPENSE — marks job COMPLETED and returns approved count from success_rows', async () => {
        const job = makeJob({ import_type: IMPORT_TYPE.INCOME, status: IMPORT_STATUS.PENDING_APPROVAL, success_rows: 5 })
        mockFrom
            .mockReturnValueOnce(makeChain(success, { data: job, error: null }))           // getJob
            .mockReturnValueOnce(makeChain({ data: [{ id: 'job-1' }], error: null }))      // atomic guard

        const result = await approveImportBatch('job-1', 'approver-1', 'rt-1')

        expect(result).toEqual({ approved: 5 })
    })

    it('EXPENSE — calls approve_expenses_by_import_job RPC and returns RPC count', async () => {
        const job = makeJob({ import_type: IMPORT_TYPE.EXPENSE, status: IMPORT_STATUS.PENDING_APPROVAL })
        mockFrom
            .mockReturnValueOnce(makeChain(success, { data: job, error: null }))           // getJob
            .mockReturnValueOnce(makeChain({ data: [{ id: 'job-1' }], error: null }))      // atomic guard
        mockRpc.mockResolvedValueOnce({ data: 3, error: null })

        const result = await approveImportBatch('job-1', 'approver-1', 'rt-1')

        expect(mockRpc).toHaveBeenCalledWith('approve_expenses_by_import_job', expect.objectContaining({ p_job_id: 'job-1' }))
        expect(result).toEqual({ approved: 3 })
    })

    it('idempotent — returns { approved: 0 } when job is already COMPLETED', async () => {
        const pendingJob   = makeJob({ status: IMPORT_STATUS.PENDING_APPROVAL })
        const completedJob = makeJob({ status: IMPORT_STATUS.COMPLETED })
        mockFrom
            .mockReturnValueOnce(makeChain(success, { data: pendingJob, error: null }))    // first getJob
            .mockReturnValueOnce(makeChain({ data: [], error: null }))                     // atomic guard fails
            .mockReturnValueOnce(makeChain(success, { data: completedJob, error: null }))  // second getJob

        const result = await approveImportBatch('job-1', 'approver-1', 'rt-1')

        expect(result).toEqual({ approved: 0 })
    })
})

/* -------------------------------------------------------------------------- */
/* rejectImportBatch                                                           */
/* -------------------------------------------------------------------------- */

describe('rejectImportBatch', () => {
    it('happy path — resolves without throwing', async () => {
        const job = makeJob({ import_type: IMPORT_TYPE.INCOME, status: IMPORT_STATUS.PENDING_APPROVAL })
        mockFrom.mockReturnValueOnce(makeChain(success, { data: job, error: null }))

        await expect(rejectImportBatch('job-1', 'rejecter-1', 'bad data')).resolves.toBeUndefined()
    })

    it('throws ImportStatusError when job is not PENDING_APPROVAL', async () => {
        const job = makeJob({ status: IMPORT_STATUS.STAGED })
        mockFrom.mockReturnValueOnce(makeChain(success, { data: job, error: null }))

        await expect(rejectImportBatch('job-1', 'rejecter-1', null)).rejects.toBeInstanceOf(ImportStatusError)
    })
})
