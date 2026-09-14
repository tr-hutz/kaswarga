import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  getRolePermissionMap,
  getRtOverrideMap,
  upsertRtOverrides,
  getOverrideCountForRole,
} from '@/lib/repositories/member-override.repository'

/* -------------------------------------------------------------------------- */
/* Mock chain builder                                                          */
/* -------------------------------------------------------------------------- */

function makeChain(result: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {}
  const self = () => chain
  chain.select      = vi.fn(self)
  chain.eq          = vi.fn(self)
  chain.neq         = vi.fn(self)
  chain.not         = vi.fn(self)
  chain.limit       = vi.fn(self)
  chain.in          = vi.fn(self)
  chain.delete      = vi.fn(self)
  chain.upsert      = vi.fn().mockResolvedValue(result)
  chain.maybeSingle = vi.fn().mockResolvedValue(result)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject)
  return chain
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = supabaseAdmin as any

/* -------------------------------------------------------------------------- */
/* getRolePermissionMap                                                        */
/* -------------------------------------------------------------------------- */

describe('getRolePermissionMap', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns an empty map when no role permissions exist', async () => {
    mockDb.from.mockReturnValue(makeChain({ data: [], error: null }))
    const map = await getRolePermissionMap('role-1')
    expect(map.size).toBe(0)
  })

  it('maps permission_id → allow correctly for multiple rows', async () => {
    mockDb.from.mockReturnValue(makeChain({
      data: [
        { permission_id: 'p-pay-approve',  allow: true },
        { permission_id: 'p-resident-view', allow: true },
      ],
      error: null,
    }))
    const map = await getRolePermissionMap('role-1')
    expect(map.get('p-pay-approve')).toBe(true)
    expect(map.get('p-resident-view')).toBe(true)
    expect(map.size).toBe(2)
  })

  it('preserves allow=false values in the map', async () => {
    mockDb.from.mockReturnValue(makeChain({
      data: [
        { permission_id: 'p-1', allow: true  },
        { permission_id: 'p-2', allow: false },
      ],
      error: null,
    }))
    const map = await getRolePermissionMap('role-1')
    expect(map.get('p-1')).toBe(true)
    expect(map.get('p-2')).toBe(false)
  })

  it('throws when the database returns an error', async () => {
    mockDb.from.mockReturnValue(makeChain({ data: null, error: new Error('DB error') }))
    await expect(getRolePermissionMap('role-1')).rejects.toThrow('DB error')
  })
})

/* -------------------------------------------------------------------------- */
/* getRtOverrideMap                                                            */
/* -------------------------------------------------------------------------- */

describe('getRtOverrideMap', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns an empty map when no overrides exist', async () => {
    mockDb.from.mockReturnValue(makeChain({ data: [], error: null }))
    const map = await getRtOverrideMap('rt-1', 'role-1')
    expect(map.size).toBe(0)
  })

  it('maps a grant override (allow=true) correctly', async () => {
    mockDb.from.mockReturnValue(makeChain({
      data: [{ permission_id: 'p-pay-approve', allow: true }],
      error: null,
    }))
    const map = await getRtOverrideMap('rt-1', 'role-1')
    expect(map.get('p-pay-approve')).toBe(true)
  })

  it('maps a revoke override (allow=false) correctly', async () => {
    mockDb.from.mockReturnValue(makeChain({
      data: [{ permission_id: 'p-pay-approve', allow: false }],
      error: null,
    }))
    const map = await getRtOverrideMap('rt-1', 'role-1')
    expect(map.get('p-pay-approve')).toBe(false)
  })

  it('handles mixed grant and revoke overrides in the same RT', async () => {
    mockDb.from.mockReturnValue(makeChain({
      data: [
        { permission_id: 'p-grant',  allow: true  },
        { permission_id: 'p-revoke', allow: false },
      ],
      error: null,
    }))
    const map = await getRtOverrideMap('rt-1', 'role-1')
    expect(map.get('p-grant')).toBe(true)
    expect(map.get('p-revoke')).toBe(false)
    expect(map.size).toBe(2)
  })

  it('throws when the database returns an error', async () => {
    mockDb.from.mockReturnValue(makeChain({ data: null, error: new Error('DB error') }))
    await expect(getRtOverrideMap('rt-1', 'role-1')).rejects.toThrow('DB error')
  })
})

/* -------------------------------------------------------------------------- */
/* upsertRtOverrides                                                           */
/* -------------------------------------------------------------------------- */

describe('upsertRtOverrides', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('does nothing when both toUpsert and toDelete are empty', async () => {
    await expect(
      upsertRtOverrides('rt-1', 'role-1', [], [])
    ).resolves.toBeUndefined()
    expect(mockDb.from).not.toHaveBeenCalled()
  })

  it('performs only the delete query when toUpsert is empty', async () => {
    mockDb.from.mockReturnValue(makeChain({ data: null, error: null }))
    await upsertRtOverrides('rt-1', 'role-1', [], ['p-1', 'p-2'])
    expect(mockDb.from).toHaveBeenCalledTimes(1)
  })

  it('performs only the upsert query when toDelete is empty', async () => {
    mockDb.from.mockReturnValue(makeChain({ data: null, error: null }))
    await upsertRtOverrides('rt-1', 'role-1', [{ permissionId: 'p-1', allow: true }], [])
    expect(mockDb.from).toHaveBeenCalledTimes(1)
  })

  it('performs both delete and upsert queries when both arrays are non-empty', async () => {
    mockDb.from
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
    await upsertRtOverrides(
      'rt-1', 'role-1',
      [{ permissionId: 'p-new', allow: true }],
      ['p-old'],
    )
    expect(mockDb.from).toHaveBeenCalledTimes(2)
  })

  it('throws when the delete query fails', async () => {
    mockDb.from.mockReturnValue(makeChain({ data: null, error: new Error('Delete failed') }))
    await expect(
      upsertRtOverrides('rt-1', 'role-1', [], ['p-1'])
    ).rejects.toThrow('Delete failed')
  })

  it('throws when the upsert query fails', async () => {
    mockDb.from.mockReturnValue(makeChain({ data: null, error: new Error('Upsert failed') }))
    await expect(
      upsertRtOverrides('rt-1', 'role-1', [{ permissionId: 'p-1', allow: true }], [])
    ).rejects.toThrow('Upsert failed')
  })
})

/* -------------------------------------------------------------------------- */
/* getOverrideCountForRole                                                     */
/* -------------------------------------------------------------------------- */

describe('getOverrideCountForRole', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns the count reported by the database', async () => {
    mockDb.from.mockReturnValue(makeChain({ count: 7, error: null }))
    const count = await getOverrideCountForRole('rt-1', 'role-1')
    expect(count).toBe(7)
  })

  it('returns 0 when the database count is null', async () => {
    mockDb.from.mockReturnValue(makeChain({ count: null, error: null }))
    const count = await getOverrideCountForRole('rt-1', 'role-1')
    expect(count).toBe(0)
  })

  it('returns 0 when the database count is zero', async () => {
    mockDb.from.mockReturnValue(makeChain({ count: 0, error: null }))
    const count = await getOverrideCountForRole('rt-1', 'role-1')
    expect(count).toBe(0)
  })

  it('throws when the database returns an error', async () => {
    mockDb.from.mockReturnValue(makeChain({ count: null, error: new Error('DB error') }))
    await expect(getOverrideCountForRole('rt-1', 'role-1')).rejects.toThrow('DB error')
  })
})
