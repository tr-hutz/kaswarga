import {
  getCurrentRole
} from './getCurrentRole'

export async function isAdmin() {

  const role =
    await getCurrentRole()

  return role === 'admin'
}