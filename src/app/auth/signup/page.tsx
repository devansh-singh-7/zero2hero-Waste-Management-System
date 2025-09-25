'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Leaf, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

    const handleSignup = async () => {
    setLoading(true)
    try {
      if (!name.trim()) {
        toast.error('Please enter your name')
        return
      }
      if (!email.trim()) {
        toast.error('Please enter your email')
        return
      }
      if (!password) {
        toast.error('Please enter a password')
        return
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          toast.error('Email already registered')
        } else {
          toast.error(data.error || 'Failed to create account')
        }
        return
      }

      // Account created successfully, now auto-login the user
      toast.success('Account created successfully!')
      
      // Automatically log in the user with their credentials
      await login(email.trim(), password)
      
      // Store user email for compatibility
      localStorage.setItem('userEmail', email.trim())
      
      // Redirect to home page
      router.push('/')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'An error occurred. Please try again.')
      console.error('Signup error:', error)
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
            <div className="bg-green-600 p-3 rounded-full">
              <Leaf className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Zero2Hero</h1>
          <p className="text-gray-600">Transform waste into rewards</p>
        </div>

        <Card className="shadow-lg border border-gray-200 bg-white">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input 
                  id="name"
                  placeholder="Enter your full name" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="h-10 border border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input 
                  id="email"
                  placeholder="Enter your email address" 
                  type="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="h-10 border border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input 
                    id="password"
                    placeholder="Create a password" 
                    type={showPassword ? "text" : "password"}
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="h-10 border border-gray-300 focus:border-green-500 focus:ring-green-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>            <Button 
              onClick={handleSignup} 
              className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-medium" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center pt-4">
              <span className="text-sm text-gray-600">Already have an account? </span>
              <Link href="/auth/signin" className="text-sm text-green-600 hover:text-green-800 font-medium">
                Sign in here
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