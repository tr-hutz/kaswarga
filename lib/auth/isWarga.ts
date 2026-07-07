import { getCurrentMembership } from './getCurrentMembership'
import type { MembershipWarga } from '../../types'

export async function isResident(): Promise<boolean | MembershipWarga | null> {

  const membership =
    await getCurrentMembership()

  return (
    membership.role === 'warga'
    &&
    membership.warga
  )
}