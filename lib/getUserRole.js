import { supabase } from './supabase'

export const getUserRole = async () => {
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null

  const email = data.user.email.trim().toLowerCase()

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

  return warga || null
}