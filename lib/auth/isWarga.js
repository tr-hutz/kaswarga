import {
  getCurrentMembership
} from './getCurrentMembership'

export async function isWarga() {

  const membership =
    await getCurrentMembership()

  return (
    membership.role === 'warga'
    &&
    membership.warga
  )
}