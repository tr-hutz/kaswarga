import { getCurrentRole } from './getCurrentRole'

export async function isTreasurer(): Promise<boolean> {
  const role = await getCurrentRole()
  return ['ADMIN', 'TREASURER'].includes(role ?? '')
}