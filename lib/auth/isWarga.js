import {
  getCurrentMembership
} from './getCurrentMembership'

export async function isResident() {

  const membership =
    await getCurrentMembership()

  return (
    membership.role === 'warga'
    &&
    membership.warga
  )
}