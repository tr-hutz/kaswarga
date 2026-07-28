import { describe, it, expect } from 'vitest'

import { PermissionService }         from '../permission-service'
import { MembershipNotFoundError, RoleNotFoundError } from '../errors'
import { PERMISSION }                from '../types'
import { makeSupabaseClient }        from './fixtures'

// Shorthand for role permission row shape returned by Supabase
function rp(code: string) {
  return { allow: true, permissions: { code } }
}

// Shorthand for override row shape
function ov(code: string, allow: boolean) {
  return { allow, permissions: { code } }
}

describe('PermissionService.loadPermissions', () => {

  /* ---------------------------------------------------------------------- */
  /* SUPER_ADMIN bypass                                                      */
  /* ---------------------------------------------------------------------- */

  describe('SUPER_ADMIN', () => {
    it('grants every permission without inspecting role tables', async () => {
      // checkSuperAdmin returns a membership → SUPER_ADMIN path
      const client  = makeSupabaseClient([
        { data: { id: 'sa-mem-1' }, error: null },
      ])
      const service = new PermissionService(client)
      const ps      = await service.loadPermissions('user-sa', 'rt-any')

      expect(ps.hasPermission(PERMISSION.PAYMENT_APPROVE)).toBe(true)
      expect(ps.hasPermission(PERMISSION.RESIDENT_DELETE)).toBe(true)
      expect(ps.hasPermission(PERMISSION.AUDIT_VIEW)).toBe(true)
      expect(ps.roleCode).toBe('SUPER_ADMIN')
    })

    it('stores the SUPER_ADMIN membership id in the result', async () => {
      const client  = makeSupabaseClient([
        { data: { id: 'sa-mem-id-42' }, error: null },
      ])
      const ps = await new PermissionService(client).loadPermissions('sa-user', 'any-rt')
      expect(ps.membershipId).toBe('sa-mem-id-42')
    })

    it('reflects the requested neighborhoodId in the result', async () => {
      const client  = makeSupabaseClient([
        { data: { id: 'sa-mem-1' }, error: null },
      ])
      const ps = await new PermissionService(client).loadPermissions('sa-user', 'rt-42')
      expect(ps.neighborhoodId).toBe('rt-42')
    })
  })

  /* ---------------------------------------------------------------------- */
  /* Regular users                                                           */
  /* ---------------------------------------------------------------------- */

  describe('Regular user', () => {
    it('loads role permissions from the database', async () => {
      const client = makeSupabaseClient([
        { data: null, error: null },                                        // not SUPER_ADMIN
        { data: { id: 'mem-1', role: 'RESIDENT' }, error: null },          // membership
        { data: { id: 'role-resident' }, error: null },                    // role lookup
        { data: [rp('resident.view'), rp('payment.view')], error: null },  // role permissions
        { data: [], error: null },                                          // no overrides
      ])
      const ps = await new PermissionService(client).loadPermissions('u-1', 'rt-1')

      expect(ps.hasPermission(PERMISSION.RESIDENT_VIEW)).toBe(true)
      expect(ps.hasPermission(PERMISSION.PAYMENT_VIEW)).toBe(true)
      expect(ps.hasPermission(PERMISSION.PAYMENT_APPROVE)).toBe(false)
    })

    it('maps CHAIR enum to RT_CHAIR role code', async () => {
      const client = makeSupabaseClient([
        { data: null, error: null },
        { data: { id: 'mem-2', role: 'CHAIR' }, error: null },
        { data: { id: 'role-chair' }, error: null },
        { data: [rp('resident.view')], error: null },
        { data: [], error: null },
      ])
      const ps = await new PermissionService(client).loadPermissions('u-chair', 'rt-1')
      expect(ps.roleCode).toBe('RT_CHAIR')
    })

    it('maps ADMIN enum to RT_ADMIN role code', async () => {
      const client = makeSupabaseClient([
        { data: null, error: null },
        { data: { id: 'mem-3', role: 'ADMIN' }, error: null },
        { data: { id: 'role-admin' }, error: null },
        { data: [], error: null },
        { data: [], error: null },
      ])
      const ps = await new PermissionService(client).loadPermissions('u-admin', 'rt-1')
      expect(ps.roleCode).toBe('RT_ADMIN')
    })

    it('stores the membership id in the result', async () => {
      const client = makeSupabaseClient([
        { data: null, error: null },
        { data: { id: 'mem-xyz', role: 'RESIDENT' }, error: null },
        { data: { id: 'role-resident' }, error: null },
        { data: [], error: null },
        { data: [], error: null },
      ])
      const ps = await new PermissionService(client).loadPermissions('u-1', 'rt-1')
      expect(ps.membershipId).toBe('mem-xyz')
    })

    it('stores the role id in the result', async () => {
      const client = makeSupabaseClient([
        { data: null, error: null },
        { data: { id: 'mem-1', role: 'RESIDENT' }, error: null },
        { data: { id: 'role-id-99' }, error: null },
        { data: [], error: null },
        { data: [], error: null },
      ])
      const ps = await new PermissionService(client).loadPermissions('u-1', 'rt-1')
      expect(ps.roleId).toBe('role-id-99')
    })
  })

  /* ---------------------------------------------------------------------- */
  /* Permission overrides                                                    */
  /* ---------------------------------------------------------------------- */

  describe('Permission overrides', () => {
    it('override GRANT adds a permission not in the role defaults', async () => {
      // Role has no payment.approve; RT override grants it
      const client = makeSupabaseClient([
        { data: null, error: null },
        { data: { id: 'mem-1', role: 'RESIDENT' }, error: null },
        { data: { id: 'role-resident' }, error: null },
        { data: [rp('resident.view')], error: null },
        { data: [ov('payment.approve', true)], error: null },   // grant
      ])
      const ps = await new PermissionService(client).loadPermissions('u-1', 'rt-1')
      expect(ps.hasPermission(PERMISSION.PAYMENT_APPROVE)).toBe(true)
    })

    it('override REVOKE removes a permission that is in the role defaults', async () => {
      // Role has payment.approve by default; RT override revokes it
      const client = makeSupabaseClient([
        { data: null, error: null },
        { data: { id: 'mem-1', role: 'CHAIR' }, error: null },
        { data: { id: 'role-chair' }, error: null },
        { data: [rp('payment.approve'), rp('resident.view')], error: null },
        { data: [ov('payment.approve', false)], error: null },   // revoke
      ])
      const ps = await new PermissionService(client).loadPermissions('u-1', 'rt-1')
      expect(ps.hasPermission(PERMISSION.PAYMENT_APPROVE)).toBe(false)
      // Other permissions from the role are still present
      expect(ps.hasPermission(PERMISSION.RESIDENT_VIEW)).toBe(true)
    })

    it('override REVOKE only removes the targeted permission', async () => {
      const client = makeSupabaseClient([
        { data: null, error: null },
        { data: { id: 'mem-1', role: 'CHAIR' }, error: null },
        { data: { id: 'role-chair' }, error: null },
        { data: [rp('payment.approve'), rp('expense.view'), rp('resident.view')], error: null },
        { data: [ov('payment.approve', false)], error: null },
      ])
      const ps = await new PermissionService(client).loadPermissions('u-1', 'rt-1')
      expect(ps.hasPermission(PERMISSION.PAYMENT_APPROVE)).toBe(false)
      expect(ps.hasPermission(PERMISSION.EXPENSE_VIEW)).toBe(true)
      expect(ps.hasPermission(PERMISSION.RESIDENT_VIEW)).toBe(true)
    })
  })

  /* ---------------------------------------------------------------------- */
  /* Error cases                                                             */
  /* ---------------------------------------------------------------------- */

  describe('Error cases', () => {
    it('throws MembershipNotFoundError when no active membership exists', async () => {
      const client = makeSupabaseClient([
        { data: null, error: null },   // not SUPER_ADMIN
        { data: null, error: null },   // no membership
      ])
      await expect(
        new PermissionService(client).loadPermissions('u-none', 'rt-1')
      ).rejects.toThrow(MembershipNotFoundError)
    })

    it('MembershipNotFoundError message includes both userId and neighborhoodId', async () => {
      const client = makeSupabaseClient([
        { data: null, error: null },
        { data: null, error: null },
      ])
      await expect(
        new PermissionService(client).loadPermissions('specific-user', 'specific-rt')
      ).rejects.toMatchObject({
        message: expect.stringContaining('specific-user'),
      })
    })

    it('throws RoleNotFoundError when the role code has no matching roles row', async () => {
      const client = makeSupabaseClient([
        { data: null, error: null },
        { data: { id: 'mem-1', role: 'UNKNOWN_ROLE' }, error: null },
        { data: null, error: null },   // role lookup returns null
      ])
      await expect(
        new PermissionService(client).loadPermissions('u-1', 'rt-1')
      ).rejects.toThrow(RoleNotFoundError)
    })
  })

  /* ---------------------------------------------------------------------- */
  /* Regression tests                                                        */
  /* ---------------------------------------------------------------------- */

  describe('Regression', () => {
    /**
     * A RESIDENT must never be able to approve payments.
     * This guard prevents a scenario where a resident could approve their
     * own payment submission if the permission set is incorrectly loaded.
     */
    it('RESIDENT has no payment.approve permission by default', async () => {
      const client = makeSupabaseClient([
        { data: null, error: null },
        { data: { id: 'mem-1', role: 'RESIDENT' }, error: null },
        { data: { id: 'role-resident' }, error: null },
        {
          data: [
            rp('resident.view'),
            rp('payment.view'),
            rp('payment.create'),
            // payment.approve deliberately absent for RESIDENT
          ],
          error: null,
        },
        { data: [], error: null },
      ])
      const ps = await new PermissionService(client).loadPermissions('resident-user', 'rt-1')
      expect(ps.hasPermission(PERMISSION.PAYMENT_APPROVE)).toBe(false)
    })

    /**
     * An empty effective permission set must return false for every check.
     * Guards against a bug where a missing role_permissions row caused an
     * undefined permission set that would throw rather than return false.
     */
    it('empty permission set returns false for any permission check', async () => {
      const client = makeSupabaseClient([
        { data: null, error: null },
        { data: { id: 'mem-1', role: 'RESIDENT' }, error: null },
        { data: { id: 'role-resident' }, error: null },
        { data: [], error: null },   // no role permissions
        { data: [], error: null },   // no overrides
      ])
      const ps = await new PermissionService(client).loadPermissions('u-1', 'rt-1')
      expect(ps.hasPermission(PERMISSION.PAYMENT_APPROVE)).toBe(false)
      expect(ps.hasPermission(PERMISSION.RESIDENT_VIEW)).toBe(false)
      expect(ps.hasAny([PERMISSION.PAYMENT_APPROVE, PERMISSION.RESIDENT_VIEW])).toBe(false)
    })

    /**
     * A user without approval permission must not be able to perform
     * approval actions even when other permissions are present.
     */
    it('user without payment.approve cannot trigger approval even with other permissions', async () => {
      const client = makeSupabaseClient([
        { data: null, error: null },
        { data: { id: 'mem-1', role: 'RESIDENT' }, error: null },
        { data: { id: 'role-resident' }, error: null },
        { data: [rp('payment.view'), rp('payment.create'), rp('resident.view')], error: null },
        { data: [], error: null },
      ])
      const ps = await new PermissionService(client).loadPermissions('u-1', 'rt-1')
      // Has other permissions — but NOT payment.approve
      expect(ps.hasPermission(PERMISSION.PAYMENT_VIEW)).toBe(true)
      expect(ps.hasPermission(PERMISSION.PAYMENT_APPROVE)).toBe(false)
    })
  })
})
