import { describe, it, expect } from 'vitest'

import { RequestContext }    from '@/lib/auth/request-context'
import { PERMISSION }        from '@/lib/auth/types'
import { makeRequestContext, makeAuthContext } from './fixtures'

describe('RequestContext', () => {

  /* ---------------------------------------------------------------------- */
  /* Field preservation                                                      */
  /* ---------------------------------------------------------------------- */

  it('preserves requestId', () => {
    const ctx = makeRequestContext({ requestId: 'req-abc' })
    expect(ctx.requestId).toBe('req-abc')
  })

  it('preserves locale', () => {
    const ctx = makeRequestContext({ locale: 'en-US' })
    expect(ctx.locale).toBe('en-US')
  })

  it('preserves timezone', () => {
    const ctx = makeRequestContext({ timezone: 'Asia/Singapore' })
    expect(ctx.timezone).toBe('Asia/Singapore')
  })

  it('preserves ipAddress', () => {
    const ctx = makeRequestContext({ ipAddress: '192.168.1.1' })
    expect(ctx.ipAddress).toBe('192.168.1.1')
  })

  it('preserves userAgent', () => {
    const ctx = makeRequestContext({ userAgent: 'Mozilla/5.0' })
    expect(ctx.userAgent).toBe('Mozilla/5.0')
  })

  /* ---------------------------------------------------------------------- */
  /* Authorization delegation                                                */
  /* ---------------------------------------------------------------------- */

  it('exposes the authorization context', () => {
    const ctx = makeRequestContext({ permissions: [PERMISSION.PAYMENT_APPROVE] })
    expect(ctx.authorization).toBeDefined()
    expect(ctx.authorization.hasPermission(PERMISSION.PAYMENT_APPROVE)).toBe(true)
  })

  it('allows accessing permissions via context.authorization.hasPermission()', () => {
    const ctx = makeRequestContext({ permissions: [PERMISSION.EXPENSE_VIEW] })
    expect(ctx.authorization.hasPermission(PERMISSION.EXPENSE_VIEW)).toBe(true)
    expect(ctx.authorization.hasPermission(PERMISSION.EXPENSE_DELETE)).toBe(false)
  })

  /* ---------------------------------------------------------------------- */
  /* Convenience getters — delegate to authorization                         */
  /* ---------------------------------------------------------------------- */

  it('userId getter returns authorization.userId', () => {
    const ctx = makeRequestContext({ contextOptions: { userId: 'u-999' } })
    expect(ctx.userId).toBe('u-999')
    expect(ctx.userId).toBe(ctx.authorization.userId)
  })

  it('membershipId getter returns authorization.membershipId', () => {
    const ctx = makeRequestContext({ contextOptions: { membershipId: 'm-888' } })
    expect(ctx.membershipId).toBe('m-888')
    expect(ctx.membershipId).toBe(ctx.authorization.membershipId)
  })

  it('neighborhoodId getter returns authorization.neighborhoodId', () => {
    const ctx = makeRequestContext({ contextOptions: { neighborhoodId: 'rt-777' } })
    expect(ctx.neighborhoodId).toBe('rt-777')
    expect(ctx.neighborhoodId).toBe(ctx.authorization.neighborhoodId)
  })

  /* ---------------------------------------------------------------------- */
  /* Immutability                                                            */
  /* ---------------------------------------------------------------------- */

  it('throws TypeError when attempting to mutate a field', () => {
    const ctx = makeRequestContext({ requestId: 'req-1' })
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(ctx as any).requestId = 'mutated'
    }).toThrow(TypeError)
  })

  it('throws TypeError when attempting to replace the authorization object', () => {
    const ctx = makeRequestContext()
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(ctx as any).authorization = makeAuthContext([])
    }).toThrow(TypeError)
  })

  /* ---------------------------------------------------------------------- */
  /* Constructor — direct construction                                       */
  /* ---------------------------------------------------------------------- */

  it('accepts all constructor params', () => {
    const authorization = makeAuthContext([PERMISSION.RESIDENT_VIEW])
    const ctx = new RequestContext({
      requestId:     'r-direct',
      locale:        'id',
      timezone:      'Asia/Jakarta',
      ipAddress:     '10.0.0.1',
      userAgent:     'test/1.0',
      authorization,
    })
    expect(ctx.requestId).toBe('r-direct')
    expect(ctx.locale).toBe('id')
    expect(ctx.timezone).toBe('Asia/Jakarta')
    expect(ctx.ipAddress).toBe('10.0.0.1')
    expect(ctx.userAgent).toBe('test/1.0')
    expect(ctx.authorization).toBe(authorization)
  })
})
