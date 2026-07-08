import { getCurrentMembership } from './getCurrentMembership'
import type { MembershipResident } from '../../types'

export async function isResident(): Promise<boolean | MembershipResident | null> {

  const membership =
    await getCurrentMembership()

  return (
    membership.role === 'RESIDENT'
    &&
    membership.resident
  )
}