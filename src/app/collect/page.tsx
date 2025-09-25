'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowRight, Clock } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg text-center bg-white/80 backdrop-blur-sm border border-green-200 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 pb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-2xl shadow-lg">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-orange-700 mb-2">Access Restricted</CardTitle>
          <CardDescription className="text-lg text-orange-600">
            Waste collection management is now restricted to administrators only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
            <p className="text-green-800 leading-relaxed">
              The collection functionality has been moved to the admin console for better oversight and management. 
              This ensures proper tracking and verification of all waste collection activities.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                <ArrowRight className="h-5 w-5 mr-2" />
                Return to Home
              </Button>
            </Link>
            
            <Link href="/admin/login">
              <Button variant="outline" className="w-full py-4 rounded-2xl font-semibold border-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200">
                <Shield className="h-5 w-5 mr-2" />
                Admin Login
              </Button>
            </Link>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-200">
            <p className="text-sm text-amber-700 flex items-center justify-center">
              <Clock className="h-4 w-4 mr-2" />
              You will be automatically redirected to the home page in a few seconds.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}