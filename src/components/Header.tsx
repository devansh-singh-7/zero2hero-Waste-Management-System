'use client'
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Menu, Coins, Leaf, Search, Bell } from "lucide-react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
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
import UserMenu from "@/components/UserMenu"
import { cn } from "@/lib/utils"

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
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState<string>('')
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  // Check if we're on auth pages
  const isAuthPage = pathname?.startsWith('/auth/')

  // Check authentication status
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      if (!isMounted) return;

      try {
        setIsLoading(true);
        
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache', // Ensure fresh data
          }
        });

        if (response.ok) {
          const userData = await response.json();
          if (isMounted) {
            setIsLoggedIn(true);
            // Access user data from the nested user object
            const user = userData.user;
            setUserName(user?.name || user?.email || 'User');
          }
        } else {
          if (isMounted) {
            setIsLoggedIn(false);
            setUserName('');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (isMounted) {
          setIsLoggedIn(false);
          setUserName('');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // Also listen for storage events to refresh auth state when login happens
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userEmail') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname]); // Add pathname to dependencies to refresh on route changes

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let isMounted = true;

    const fetchNotifications = async () => {
      if (!isLoggedIn || !isMounted) return;

      try {
        const response = await fetch('/api/user/notifications', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            // Ensure notifications is always an array
            setNotifications(Array.isArray(data) ? data : []);
          }
        } else {
          if (isMounted) {
            setNotifications([]);
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        if (isMounted) {
          setNotifications([]);
        }
      }
    };

    // Only fetch notifications when logged in and not loading
    if (isLoggedIn && !isLoading) {
      fetchNotifications();
    }

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, isLoading]); // Remove router from dependencies

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        // Update state
        setIsLoggedIn(false);
        setNotifications([]);
        setUserName('');
        // Clear any stored auth data
        localStorage.removeItem('authToken');
        // Redirect
        router.push('/auth/signin');
      } else {
        console.error('Logout failed:', response.status);
        // Force logout on front-end even if API call fails
        setIsLoggedIn(false);
        setUserName('');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error logging out:', error);
      // Force logout on front-end even if API call fails
      setIsLoggedIn(false);
      setUserName('');
      setNotifications([]);
    }
  };

  const handleNotificationClick = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/user/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ isRead: true }),
        credentials: 'include'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
      } else {
        console.error('Failed to mark notification as read:', response.status);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

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

        <div className="flex items-center gap-2">
          {isMobile && (
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          )}
          
          {/* Only show these elements if not on auth pages */}
          {!isAuthPage && (
            <>
              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative hover:bg-gray-100"
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                    {notifications.length > 0 && (
                      <div className="absolute -top-1 -right-1">
                        <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0">
                          {notifications.length > 9 ? '9+' : notifications.length}
                        </Badge>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                  <div className="px-2 py-1.5 text-sm font-semibold border-b">
                    Notifications
                  </div>
                  {notifications.length > 0 ? (
                    <>
                      {notifications.slice(0, 5).map((notification) => (
                        <DropdownMenuItem 
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification.id)}
                          className="px-3 py-2 cursor-pointer flex flex-col items-start gap-1"
                        >
                          <div className="flex justify-between w-full">
                            <span className="text-xs font-medium text-gray-500 capitalize">
                              {notification.type}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(notification.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <span className="text-sm text-gray-800">{notification.message}</span>
                        </DropdownMenuItem>
                      ))}
                      {notifications.length > 5 && (
                        <div className="px-3 py-1 text-xs text-gray-500 text-center border-t">
                          ... and {notifications.length - 5} more
                        </div>
                      )}
                      <DropdownMenuItem asChild className="border-t">
                        <Link href="/notifications" className="px-3 py-2 text-center w-full text-sm font-medium text-green-600 hover:text-green-700">
                          View All Notifications
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                      No new notifications
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Auth State Display */}
              {isLoading ? (
                <div className="h-10 w-24 bg-gray-100 animate-pulse rounded-md" />
              ) : (
                <>
                  {isLoggedIn ? (
                    <>
                      <div className=" bg-green-300 border border-green-200 rounded-full px-3 py-1 flex items-center">
                        <Coins className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm font-medium text-green-700">
                          <TotalEarnings />
                        </span>
                      </div>
                      <UserMenu 
                        userName={userName}
                        onLogout={handleLogout}
                      />
                    </>
                  ) : (
                    <Button 
                      onClick={() => router.push('/auth/signin')} 
                      variant="default"
                      className="ml-2"
                    >
                      Sign In
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
