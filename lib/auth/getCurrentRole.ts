import { getCurrentMembership } from './getCurrentMembership'
import type { UserRole } from '../../types'

export async function getCurrentRole(): Promise<UserRole | null> {

  const membership =
    await getCurrentMembership()

  return membership.role
}