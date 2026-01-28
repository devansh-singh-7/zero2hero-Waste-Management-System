'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Loader } from 'lucide-react'

interface AdminProtectedProps {
  children: ReactNode
}

export default function AdminProtected({ children }: AdminProtectedProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [adminData, setAdminData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth/check', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.isAdmin) {
            setIsAdmin(true)
            setAdminData(data.admin)
          } else {
            router.push('/admin/login')
          }
        } else {
          router.push('/admin/login')
        }
      } catch (error) {
        console.error('Admin auth check failed:', error)
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this area.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export { AdminProtected }
