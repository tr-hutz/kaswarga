import {
  getCurrentRole
} from './getCurrentRole'

export async function isTreasurer() {

  const role =
    await getCurrentRole()

  return [
    'admin',
    'bendahara'
  ].includes(role)
}