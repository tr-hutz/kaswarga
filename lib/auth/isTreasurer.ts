import { getCurrentRole } from './getCurrentRole'

export async function isTreasurer(): Promise<boolean> {
  const role = await getCurrentRole()
  return ['admin', 'bendahara'].includes(role ?? '')
}