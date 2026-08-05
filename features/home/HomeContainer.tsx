'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect }  from 'react'
import { useRouter }  from 'next/navigation'
import { useAuth }    from '@/lib/auth/useAuth'
import HomeView       from './components/HomeView'
import { useHome }    from './hooks/useHome'

export default function HomeContainer() {

  const { rtId, loading } = useAuth()
  const router            = useRouter()
  const home              = useHome()

  // SUPER_ADMIN has no RT — redirect to the RT management page
  useEffect(() => {
    if (!loading && !rtId) {
      router.replace('/rt/registration')
    }
  }, [loading, rtId, router])

  if (!rtId) return null

  return (
    <HomeView
      {...home}
    />
  )
}
