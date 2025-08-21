'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/user/profile')
        if (!res.ok) {
          router.push('/auth/signin')
          return
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/signin')
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return <>{children}</>
}
