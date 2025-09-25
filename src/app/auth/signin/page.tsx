'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Leaf } from "lucide-react"
import Link from "next/link"
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = async () => {
    setLoading(true)
    try {
      await login(email.trim(), password)
      
      // Store user email in localStorage for compatibility
      localStorage.setItem('userEmail', email.trim())
      
      toast.success('Signed in successfully!')
      
      // Redirect to home page
      router.push('/')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-500 p-2 rounded-full">
              <Leaf className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <Card className="shadow-lg border border-gray-200 bg-white">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input 
                  id="email"
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="h-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input 
                  id="password"
                  placeholder="Enter your password" 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="h-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            <Button 
              onClick={handleLogin} 
              className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-medium" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center pt-4">
              <span className="text-sm text-gray-600">Don't have an account? </span>
              <Link href="/auth/signup" className="text-sm text-green-600 hover:text-green-800 font-medium">
                Create one now
              </Link>
            </div>

            <div className="text-center pt-4">
              <Link href="/" className="text-sm text-green-600 hover:text-green-800">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}