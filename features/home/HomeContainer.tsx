// @ts-nocheck
'use client'

import { useEffect }  from 'react'
import { useRouter }  from 'next/navigation'
import { useAuth }    from '@/lib/auth/useAuth'
import HomeView       from './components/HomeView'
import { useHome }    from './hooks/useHome'

export default function HomeContainer() {

  const { role, loading } = useAuth()
  const router            = useRouter()
  const home              = useHome()

  useEffect(() => {
    if (!loading && role === 'super_admin') {
      router.replace('/rt')
    }
  }, [loading, role])

  if (role === 'super_admin') return null

  return (
    <HomeView
      {...home}
    />
  )
}