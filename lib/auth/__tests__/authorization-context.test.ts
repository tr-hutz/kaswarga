import { describe, it, expect } from 'vitest'

import { AuthorizationContext } from '../authorization-context'
import { PERMISSION }           from '../types'
import { makePermissionSet }    from './fixtures'

function ctx(permissions: string[] = [], options = {}) {
  return new AuthorizationContext({
    permissionSet: makePermissionSet(permissions as any[], options),
  })
}

describe('AuthorizationContext', () => {

  /* ---------------------------------------------------------------------- */
  /* Field exposure                                                          */
  /* ---------------------------------------------------------------------- */

  it('exposes userId from the PermissionSet', () => {
    expect(ctx([], { userId: 'u-123' }).userId).toBe('u-123')
  })

  it('exposes membershipId from the PermissionSet', () => {
    expect(ctx([], { membershipId: 'm-456' }).membershipId).toBe('m-456')
  })

  it('exposes neighborhoodId from the PermissionSet', () => {
    expect(ctx([], { neighborhoodId: 'rt-789' }).neighborhoodId).toBe('rt-789')
  })

  it('exposes roleId from the PermissionSet', () => {
    expect(ctx([], { roleId: 'role-abc' }).roleId).toBe('role-abc')
  })

  it('exposes roleCode from the PermissionSet', () => {
    expect(ctx([], { roleCode: 'RT_CHAIR' }).roleCode).toBe('RT_CHAIR')
  })

  /* ---------------------------------------------------------------------- */
  /* hasPermission                                                           */
  /* ---------------------------------------------------------------------- */

  describe('hasPermission()', () => {
    it('returns true for a granted permission', () => {
      expect(ctx([PERMISSION.PAYMENT_APPROVE]).hasPermission(PERMISSION.PAYMENT_APPROVE)).toBe(true)
    })

    it('returns false for a permission that is not granted', () => {
      expect(ctx([PERMISSION.RESIDENT_VIEW]).hasPermission(PERMISSION.PAYMENT_APPROVE)).toBe(false)
    })

    it('returns false when the permission set is empty', () => {
      expect(ctx([]).hasPermission(PERMISSION.PAYMENT_APPROVE)).toBe(false)
    })
  })

  /* ---------------------------------------------------------------------- */
  /* hasAny                                                                  */
  /* ---------------------------------------------------------------------- */

  describe('hasAny()', () => {
    it('returns true when at least one permission matches', () => {
      const context = ctx([PERMISSION.EXPENSE_VIEW])
      expect(context.hasAny(PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE)).toBe(true)
    })

    it('returns false when none of the permissions match', () => {
      const context = ctx([PERMISSION.RESIDENT_VIEW])
      expect(context.hasAny(PERMISSION.PAYMENT_APPROVE, PERMISSION.EXPENSE_CREATE)).toBe(false)
    })

    it('returns false for an empty context', () => {
      expect(ctx([]).hasAny(PERMISSION.PAYMENT_APPROVE)).toBe(false)
    })
  })

  /* ---------------------------------------------------------------------- */
  /* hasAll                                                                  */
  /* ---------------------------------------------------------------------- */

  describe('hasAll()', () => {
    it('returns true when every permission matches', () => {
      const context = ctx([PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE])
      expect(context.hasAll(PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE)).toBe(true)
    })

    it('returns false when at least one permission is missing', () => {
      const context = ctx([PERMISSION.EXPENSE_VIEW])
      expect(context.hasAll(PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE)).toBe(false)
    })

    it('returns false for an empty context', () => {
      expect(ctx([]).hasAll(PERMISSION.EXPENSE_VIEW)).toBe(false)
    })
  })

  /* ---------------------------------------------------------------------- */
  /* getPermissions                                                          */
  /* ---------------------------------------------------------------------- */

  describe('getPermissions()', () => {
    it('returns the full effective permission set', () => {
      const context = ctx([PERMISSION.PAYMENT_VIEW, PERMISSION.RESIDENT_VIEW])
      const perms   = context.getPermissions()
      expect(perms.has(PERMISSION.PAYMENT_VIEW)).toBe(true)
      expect(perms.has(PERMISSION.RESIDENT_VIEW)).toBe(true)
      expect(perms.has(PERMISSION.PAYMENT_APPROVE)).toBe(false)
    })
  })

  /* ---------------------------------------------------------------------- */
  /* isSelf                                                                  */
  /* ---------------------------------------------------------------------- */

  describe('isSelf()', () => {
    it('returns true when the userId matches', () => {
      expect(ctx([], { userId: 'user-1' }).isSelf('user-1')).toBe(true)
    })

    it('returns false when the userId does not match', () => {
      expect(ctx([], { userId: 'user-1' }).isSelf('user-2')).toBe(false)
    })
  })

  /* ---------------------------------------------------------------------- */
  /* isSameNeighborhood                                                      */
  /* ---------------------------------------------------------------------- */

  describe('isSameNeighborhood()', () => {
    it('returns true when the neighborhoodId matches', () => {
      expect(ctx([], { neighborhoodId: 'rt-1' }).isSameNeighborhood('rt-1')).toBe(true)
    })

    it('returns false when the neighborhoodId does not match', () => {
      expect(ctx([], { neighborhoodId: 'rt-1' }).isSameNeighborhood('rt-2')).toBe(false)
    })
  })

  /* ---------------------------------------------------------------------- */
  /* Immutability                                                            */
  /* ---------------------------------------------------------------------- */

  describe('immutability', () => {
    it('throws TypeError when attempting to mutate a field in strict mode', () => {
      const context = ctx([], { userId: 'u-1' })
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(context as any).userId = 'hacked'
      }).toThrow(TypeError)
    })

    it('does not allow adding new properties after construction', () => {
      const context = ctx([])
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(context as any).newProp = 'value'
      }).toThrow(TypeError)
    })
  })
})
