'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { User, ChevronDown, LogIn, LogOut } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AuthButtons() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleSignIn = () => {
    router.push('/auth/signin')
  }

  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      if (res.ok) {
        setUser(null)
        toast.success('Logged out successfully!')
        router.push('/auth/signin')
      } else {
        throw new Error('Logout failed')
      }
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to log out.')
    }
  }

  if (loading) {
    return null // Or a loading spinner
  }

  return (
    <>
      {!user ? (
        <Button 
          onClick={handleSignIn}
          className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-base"
        >
          <LogIn className="ml-1 md:ml-2 h-4 w-4 md:h-5 md:w-5" />
          Sign In
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex items-center">
              <User className="h-5 w-5 mr-1" />
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <span className="font-medium">{user.name || user.email}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  )
}
