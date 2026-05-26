'use client'

import {
  useDashboardAnalytics
} from './hooks/useDashboardAnalytics'

import DashboardView
  from './components/DashboardView'

export default function DashboardContainer() {

  const dashboard =
    useDashboardAnalytics()

  return (
    <DashboardView
      {...dashboard}
    />
  )
}