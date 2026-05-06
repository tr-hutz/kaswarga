import { supabase } from "./supabase"

export const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID').format(angka)
}

export const formatBulan = (ids = []) => {
  const names = ids
    .map(id => bulanList.find(b => b.id === id)?.nama)

  if (names.length === 1) return names[0]

  return names.join(', ')
}

export const formatString = (template, ...args) => {
  return template.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[number] !== 'undefined' ? args[number] : match;
  });
};

export const bulanList = [
  { id: 1, nama: 'Jan' },
  { id: 2, nama: 'Feb' },
  { id: 3, nama: 'Mar' },
  { id: 4, nama: 'Apr' },
  { id: 5, nama: 'Mei' },
  { id: 6, nama: 'Jun' },
  { id: 7, nama: 'Jul' },
  { id: 8, nama: 'Agu' },
  { id: 9, nama: 'Sep' },
  { id: 10, nama: 'Okt' },
  { id: 11, nama: 'Nov' },
  { id: 12, nama: 'Des' }
]

export const logout = async () => {
  await supabase.auth.signOut()
  window.location.href = '/'
}