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

export const maskPhone = (
  phone: string | null | undefined,
  options: { visibleDigits?: number; maskChar?: string } = {}
): string => {
  if (!phone) return '-'
  const { visibleDigits = 4, maskChar = '*' } = options
  if (phone.length <= visibleDigits) return phone
  return maskChar.repeat(phone.length - visibleDigits) + phone.slice(-visibleDigits)
}

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
