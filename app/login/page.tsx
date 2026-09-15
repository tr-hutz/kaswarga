import LoginFeature
  from '@/features/auth/login'


export const dynamic = 'force-static'
export default function Page() {

  return (
    <LoginFeature />
  )
}