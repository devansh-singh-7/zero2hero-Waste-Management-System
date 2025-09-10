'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function CollectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect users away from collection page after 3 seconds
    const timer = setTimeout(() => {
      router.push('/')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-orange-500" />
          </div>
          <CardTitle className="text-orange-700">Access Restricted</CardTitle>
          <CardDescription>
            Waste collection management is now restricted to administrators only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            The collection functionality has been moved to the admin console for better oversight and management.
          </p>
          
          <div className="space-y-3">
            <Link href="/">
              <Button className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
            </Link>
            
            <Link href="/admin/login">
              <Button variant="outline" className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Admin Login
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-gray-500">
            You will be automatically redirected to the home page in a few seconds.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}