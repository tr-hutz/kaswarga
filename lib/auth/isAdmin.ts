import { getCurrentRole } from './getCurrentRole'

export async function isAdmin(): Promise<boolean> {

  const role =
    await getCurrentRole()

  return role === 'admin'
}