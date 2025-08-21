'use client'
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Menu, Coins, Leaf, Search, Bell, User, ChevronDown, LogIn, LogOut } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

import { useMediaQuery } from "@/hooks/useMediaQuery"

import TotalEarnings from "@/components/TotalEarnings"
import AuthButtons from "@/components/AuthButtons"

// Define the Notification type
interface Notification {
  id: number
  userId: number
  message: string
  type: string
  isRead: boolean
  createdAt: Date
}

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/user/notifications')
        if (response.ok) {
          const data = await response.json()
          setNotifications(data)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    fetchNotifications()

    // Set up periodic checking for new notifications
    const notificationInterval = setInterval(fetchNotifications, 30000) // Check every 30 seconds

    return () => clearInterval(notificationInterval)
  }, [])

  useEffect(() => {
    const fetchUserBalance = async () => {
      try {
        const response = await fetch('/api/user/balance')
        if (response.ok) {
          const data = await response.json()
          setBalance(data.balance)
        }
      } catch (error) {
        console.error("Error fetching user balance:", error)
      }
    }

    fetchUserBalance()

    // Add an event listener for balance updates
    const handleBalanceUpdate = (event: CustomEvent) => {
      setBalance(event.detail)
    }

    window.addEventListener('balanceUpdated', handleBalanceUpdate as EventListener)

    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener)
    }
  }, [])

  const handleNotificationClick = async (notificationId: number) => {
    try {
      // Mark notification as read via API
      const response = await fetch(`/api/user/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      })
      
      if (response.ok) {
        setNotifications(prevNotifications => 
          prevNotifications.filter(notification => notification.id !== notificationId)
        )
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2 md:mr-4" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/" className="flex items-center">
            <Leaf className="h-6 w-6 md:h-8 md:w-8 text-green-500 mr-1 md:mr-2" />
            <div className="flex flex-col">
              <span className="font-bold text-base md:text-lg text-gray-800">Zero2Hero</span>
            </div>
          </Link>
        </div>
        {!isMobile && (
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}
        <div className="flex items-center">
          {isMobile && (
            <Button variant="ghost" size="icon" className="mr-2">
              <Search className="h-5 w-5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{notification.type}</span>
                      <span className="text-sm text-gray-500">{notification.message}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem>No new notifications</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="mr-2 md:mr-4 flex items-center bg-gray-100 rounded-full px-2 md:px-3 py-1">
            <Coins className="h-4 w-4 md:h-5 md:w-5 mr-1 text-green-500" />
            <span className="font-semibold text-sm md:text-base text-gray-800">
              <TotalEarnings />
            </span>
          </div>
          <AuthButtons />
        </div>
      </div>
    </header>
  )
}