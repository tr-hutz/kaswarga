import { supabase } from './supabase'

export const getUserRole = async (): Promise<{ role: string | null; nama: string | null } | null> => {
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null

  const email = (data.user.email ?? '').trim().toLowerCase()

  const { data: warga, error } = await supabase
    .from('warga')
    .select('role, nama')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    console.log('ERROR getting role: ', error);
    return null
  }

  console.log('WARGA: ', warga);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (warga as any) || null
}