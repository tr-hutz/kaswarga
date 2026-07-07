import { supabase } from './supabase'

export const getUserRole = async (): Promise<{ role: string | null; name: string | null } | null> => {
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null

  const email = (data.user.email ?? '').trim().toLowerCase()

  const { data: resident, error } = await supabase
    .from('residents')
    .select('role, name')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    console.log('ERROR getting role: ', error);
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (resident as any) || null
}