// In lib/withAuth.tsx
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export function withAuth(WrappedComponent: React.ComponentType) {
  return function ProtectedRoute(props: any) {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
      if (status === 'loading') return // Do nothing while loading
      if (!session) router.replace('/login')
      if (session?.user?.subscriptionStatus !== 'active') router.replace('/subscription')
    }, [session, status, router])

    if (status === 'loading') {
      return <div>Loading...</div>
    }

    if (session?.user?.subscriptionStatus === 'active') {
      return <WrappedComponent {...props} />
    }

    return null
  }
}