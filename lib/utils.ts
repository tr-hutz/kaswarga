import { supabase } from './supabase'
import { formatDistanceToNow } from 'date-fns'

export const formatAccounting = (n: number | null | undefined): string =>
  new Intl.NumberFormat('id-ID').format(n || 0)

export const formatRupiah = (angka: number | string | null | undefined): string => {
  const number = Number(angka || 0)
  return `Rp ${number.toLocaleString('id-ID')}`
}

export const formatMonths = (ids: number[] = []): string => {
  const names = ids
    .map(id => monthList.find(b => b.id === id)?.name)
    .filter(Boolean) as string[]

  if (names.length === 1) return names[0]
  return names.join(', ')
}

export const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID')
}

export function formatRelativeDate(value: string | null | undefined): string {
  if (!value) return '-'

  const date = new Date(String(value).replace(' ', 'T'))

  if (Number.isNaN(date.getTime())) return '-'

  return formatDistanceToNow(date, { addSuffix: true })
}

export const formatString = (template: string, ...args: unknown[]): string =>
  template.replace(/{(\d+)}/g, (match, number) =>
    typeof args[number] !== 'undefined' ? String(args[number]) : match
  )

export const monthList = [
  { id: 1,  name: 'Jan' },
  { id: 2,  name: 'Feb' },
  { id: 3,  name: 'Mar' },
  { id: 4,  name: 'Apr' },
  { id: 5,  name: 'Mei' },
  { id: 6,  name: 'Jun' },
  { id: 7,  name: 'Jul' },
  { id: 8,  name: 'Agu' },
  { id: 9,  name: 'Sep' },
  { id: 10, name: 'Okt' },
  { id: 11, name: 'Nov' },
  { id: 12, name: 'Des' },
]

export const logout = async (): Promise<void> => {
  await supabase.auth.signOut()
  window.location.href = '/'
}