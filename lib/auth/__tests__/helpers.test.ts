import { describe, it, expect } from 'vitest'

import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
} from '../helpers'
import { ForbiddenError }   from '../errors'
import { PERMISSION }       from '../types'
import { makeAuthContext }  from './fixtures'

describe('Authorization Helpers', () => {

  /* ---------------------------------------------------------------------- */
  /* hasPermission                                                           */
  /* ---------------------------------------------------------------------- */

  describe('hasPermission()', () => {
    it('returns true when the context holds the permission', () => {
      const ctx = makeAuthContext([PERMISSION.PAYMENT_APPROVE])
      expect(hasPermission(ctx, PERMISSION.PAYMENT_APPROVE)).toBe(true)
    })

    it('returns false when the context does not hold the permission', () => {
      const ctx = makeAuthContext([PERMISSION.RESIDENT_VIEW])
      expect(hasPermission(ctx, PERMISSION.PAYMENT_APPROVE)).toBe(false)
    })

    it('returns false for an empty permission set', () => {
      const ctx = makeAuthContext([])
      expect(hasPermission(ctx, PERMISSION.PAYMENT_VIEW)).toBe(false)
    })

    it('never throws', () => {
      const ctx = makeAuthContext([])
      expect(() => hasPermission(ctx, PERMISSION.PAYMENT_APPROVE)).not.toThrow()
    })
  })

  /* ---------------------------------------------------------------------- */
  /* hasAnyPermission                                                        */
  /* ---------------------------------------------------------------------- */

  describe('hasAnyPermission()', () => {
    it('returns true when at least one permission is present', () => {
      const ctx = makeAuthContext([PERMISSION.EXPENSE_VIEW])
      expect(hasAnyPermission(ctx, [PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE])).toBe(true)
    })

    it('returns true when only the last permission in the list matches', () => {
      const ctx = makeAuthContext([PERMISSION.EXPENSE_DELETE])
      expect(hasAnyPermission(ctx, [PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE, PERMISSION.EXPENSE_DELETE])).toBe(true)
    })

    it('returns false when none of the permissions are present', () => {
      const ctx = makeAuthContext([PERMISSION.RESIDENT_VIEW])
      expect(hasAnyPermission(ctx, [PERMISSION.PAYMENT_APPROVE, PERMISSION.EXPENSE_CREATE])).toBe(false)
    })

    it('never throws', () => {
      const ctx = makeAuthContext([])
      expect(() => hasAnyPermission(ctx, [PERMISSION.PAYMENT_APPROVE])).not.toThrow()
    })
  })

  /* ---------------------------------------------------------------------- */
  /* hasAllPermissions                                                       */
  /* ---------------------------------------------------------------------- */

  describe('hasAllPermissions()', () => {
    it('returns true when every permission is present', () => {
      const ctx = makeAuthContext([PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE])
      expect(hasAllPermissions(ctx, [PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE])).toBe(true)
    })

    it('returns false when one permission is missing', () => {
      const ctx = makeAuthContext([PERMISSION.EXPENSE_VIEW])
      expect(hasAllPermissions(ctx, [PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE])).toBe(false)
    })

    it('returns false when all permissions are missing', () => {
      const ctx = makeAuthContext([])
      expect(hasAllPermissions(ctx, [PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE])).toBe(false)
    })

    it('never throws', () => {
      const ctx = makeAuthContext([])
      expect(() => hasAllPermissions(ctx, [PERMISSION.PAYMENT_APPROVE])).not.toThrow()
    })
  })

  /* ---------------------------------------------------------------------- */
  /* requirePermission                                                       */
  /* ---------------------------------------------------------------------- */

  describe('requirePermission()', () => {
    it('does not throw when the permission is present', () => {
      const ctx = makeAuthContext([PERMISSION.PAYMENT_APPROVE])
      expect(() => requirePermission(ctx, PERMISSION.PAYMENT_APPROVE)).not.toThrow()
    })

    it('throws ForbiddenError when the permission is missing', () => {
      const ctx = makeAuthContext([PERMISSION.RESIDENT_VIEW])
      expect(() => requirePermission(ctx, PERMISSION.PAYMENT_APPROVE)).toThrow(ForbiddenError)
    })

    it('includes the denied permission code in the error', () => {
      const ctx = makeAuthContext([])
      try {
        requirePermission(ctx, PERMISSION.PAYMENT_APPROVE)
        expect.fail('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenError)
        expect((err as ForbiddenError).permission).toBe(PERMISSION.PAYMENT_APPROVE)
      }
    })
  })

  /* ---------------------------------------------------------------------- */
  /* requireAnyPermission                                                    */
  /* ---------------------------------------------------------------------- */

  describe('requireAnyPermission()', () => {
    it('does not throw when at least one permission is present', () => {
      const ctx = makeAuthContext([PERMISSION.EXPENSE_VIEW])
      expect(() =>
        requireAnyPermission(ctx, [PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE])
      ).not.toThrow()
    })

    it('throws ForbiddenError when none of the permissions are present', () => {
      const ctx = makeAuthContext([PERMISSION.RESIDENT_VIEW])
      expect(() =>
        requireAnyPermission(ctx, [PERMISSION.PAYMENT_APPROVE, PERMISSION.EXPENSE_CREATE])
      ).toThrow(ForbiddenError)
    })

    it('throws ForbiddenError for an empty context', () => {
      const ctx = makeAuthContext([])
      expect(() =>
        requireAnyPermission(ctx, [PERMISSION.PAYMENT_APPROVE])
      ).toThrow(ForbiddenError)
    })
  })

  /* ---------------------------------------------------------------------- */
  /* requireAllPermissions                                                   */
  /* ---------------------------------------------------------------------- */

  describe('requireAllPermissions()', () => {
    it('does not throw when all permissions are present', () => {
      const ctx = makeAuthContext([PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE])
      expect(() =>
        requireAllPermissions(ctx, [PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE])
      ).not.toThrow()
    })

    it('throws ForbiddenError when one permission is missing', () => {
      const ctx = makeAuthContext([PERMISSION.EXPENSE_VIEW])
      expect(() =>
        requireAllPermissions(ctx, [PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE])
      ).toThrow(ForbiddenError)
    })

    it('reports the specific missing permission in the error', () => {
      const ctx = makeAuthContext([PERMISSION.EXPENSE_VIEW])
      try {
        requireAllPermissions(ctx, [PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE])
        expect.fail('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenError)
        expect((err as ForbiddenError).permission).toBe(PERMISSION.EXPENSE_CREATE)
      }
    })

    it('throws ForbiddenError for an entirely empty context', () => {
      const ctx = makeAuthContext([])
      expect(() =>
        requireAllPermissions(ctx, [PERMISSION.EXPENSE_VIEW, PERMISSION.EXPENSE_CREATE])
      ).toThrow(ForbiddenError)
    })
  })
})
