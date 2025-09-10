'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Leaf, Shield } from "lucide-react"
import Link from "next/link"
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Login failed')
      }
      
      const data = await res.json()
      
      // Store admin session
      localStorage.setItem('adminEmail', data.admin.email)
      
      toast.success('Admin login successful!')
      
      // Redirect to admin console
      router.push('/admin')
      
      // Force refresh
      setTimeout(() => {
        window.location.href = '/admin'
      }, 500)
    } catch (e: any) {
      toast.error(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-green-200">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-green-600 mr-2" />
            <Leaf className="h-8 w-8 text-green-500 mr-2" />
            <span className="text-2xl font-bold text-gray-800">Admin Console</span>
          </div>
          <CardTitle className="text-green-700">Administrator Login</CardTitle>
          <CardDescription>
            Access restricted to authorized administrators only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            placeholder="Admin Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            type="email"
          />
          <Input 
            placeholder="Admin Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
          />
          <Button onClick={handleLogin} className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? 'Signing in...' : 'Admin Sign In'}
          </Button>
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
