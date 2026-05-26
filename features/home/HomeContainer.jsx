'use client'

import HomeView
  from './components/HomeView'

import {
  useHome
} from './hooks/useHome'

export default function HomeContainer() {

  const home =
    useHome()

  return (
    <HomeView
      {...home}
    />
  )
}