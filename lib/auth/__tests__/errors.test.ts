import { describe, it, expect } from 'vitest'

import {
  AuthorizationError,
  UnauthorizedError,
  ForbiddenError,
  UnknownRoleError,
  UnknownUserError,
  MembershipNotFoundError,
  RoleNotFoundError,
} from '@/lib/auth/errors'

describe('Authorization Error Classes', () => {

  describe('AuthorizationError', () => {
    it('sets the message', () => {
      const err = new AuthorizationError('base error')
      expect(err.message).toBe('base error')
      expect(err.name).toBe('AuthorizationError')
    })

    it('is an instance of Error', () => {
      expect(new AuthorizationError('x')).toBeInstanceOf(Error)
    })
  })

  describe('UnauthorizedError', () => {
    it('has a default message', () => {
      expect(new UnauthorizedError().message).toBe('Authentication required')
    })

    it('accepts a custom message', () => {
      expect(new UnauthorizedError('session expired').message).toBe('session expired')
    })

    it('is an instance of AuthorizationError', () => {
      expect(new UnauthorizedError()).toBeInstanceOf(AuthorizationError)
    })

    it('has the correct name', () => {
      expect(new UnauthorizedError().name).toBe('UnauthorizedError')
    })
  })

  describe('ForbiddenError', () => {
    it('includes the permission code in the message', () => {
      const err = new ForbiddenError('payment.approve')
      expect(err.message).toContain('payment.approve')
    })

    it('stores the permission code on the instance', () => {
      const err = new ForbiddenError('payment.approve')
      expect(err.permission).toBe('payment.approve')
    })

    it('works without a permission code', () => {
      const err = new ForbiddenError()
      expect(err.message).toBe('Permission denied')
      expect(err.permission).toBeUndefined()
    })

    it('is an instance of AuthorizationError', () => {
      expect(new ForbiddenError()).toBeInstanceOf(AuthorizationError)
    })

    it('has the correct name', () => {
      expect(new ForbiddenError().name).toBe('ForbiddenError')
    })
  })

  describe('UnknownRoleError', () => {
    it('includes the userId in the message', () => {
      const err = new UnknownRoleError('user-abc')
      expect(err.message).toContain('user-abc')
    })

    it('is an instance of AuthorizationError', () => {
      expect(new UnknownRoleError('u')).toBeInstanceOf(AuthorizationError)
    })
  })

  describe('UnknownUserError', () => {
    it('includes the userId in the message', () => {
      const err = new UnknownUserError('user-xyz')
      expect(err.message).toContain('user-xyz')
    })

    it('is an instance of AuthorizationError', () => {
      expect(new UnknownUserError('u')).toBeInstanceOf(AuthorizationError)
    })
  })

  describe('MembershipNotFoundError', () => {
    it('includes both userId and neighborhoodId in the message', () => {
      const err = new MembershipNotFoundError('user-1', 'rt-99')
      expect(err.message).toContain('user-1')
      expect(err.message).toContain('rt-99')
    })

    it('is an instance of AuthorizationError', () => {
      expect(new MembershipNotFoundError('u', 'rt')).toBeInstanceOf(AuthorizationError)
    })
  })

  describe('RoleNotFoundError', () => {
    it('includes the role code in the message', () => {
      const err = new RoleNotFoundError('UNKNOWN_ROLE')
      expect(err.message).toContain('UNKNOWN_ROLE')
    })

    it('is an instance of AuthorizationError', () => {
      expect(new RoleNotFoundError('X')).toBeInstanceOf(AuthorizationError)
    })
  })
})
