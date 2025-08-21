'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Leaf } from "lucide-react"
import Link from "next/link"
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async () => {
    setLoading(true)
    try {
      // Client-side validation
      if (!email) {
        toast.error('Email is required')
        return
      }
      if (!password) {
        toast.error('Password is required')
        return
      }
      if (!email.includes('@')) {
        toast.error('Please enter a valid email address')
        return
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          password
        }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        if (res.status === 422) {
          // Validation error
          if (data.details) {
            const messages = Object.values(data.details).filter(Boolean)
            toast.error(messages.join('. '))
          } else {
            toast.error(data.error || 'Validation failed')
          }
        } else if (res.status === 409) {
          // Conflict - already exists
          toast.error(data.error || 'User already exists')
        } else {
          // Other errors
          toast.error(data.error || 'Sign up failed')
        }
        return
      }

      toast.success('Account created successfully!')
      router.push('/auth/signin')
    } catch (e: any) {
      toast.error('An error occurred. Please try again.')
      console.error('Signup error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Leaf className="h-8 w-8 text-green-500 mr-2" />
            <span className="text-2xl font-bold text-gray-800">Zero2Hero</span>
          </div>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Sign up with your email and create a password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Name (optional)" value={name} onChange={e => setName(e.target.value)} />
          <Input 
            placeholder="Email address" 
            type="email"
            value={email} 
            onChange={e => setEmail(e.target.value)}
          />
          <Input 
            placeholder="Password (required)" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
          />
          <Button onClick={handleSignup} className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Sign Up'}
          </Button>
          <div className="text-center text-sm text-gray-600">
            <Link href="/auth/signin" className="text-green-600 hover:text-green-700">
              Already have an account? Sign in →
            </Link>
          </div>
          <div className="text-center text-sm text-gray-600">
            <Link href="/" className="text-green-600 hover:text-green-700">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}