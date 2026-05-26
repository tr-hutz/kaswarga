import {
  getCurrentMembership
} from './getCurrentMembership'

export async function getCurrentRole() {

  const membership =
    await getCurrentMembership()

  return membership.role
}