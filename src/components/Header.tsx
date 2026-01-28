'use client'
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Menu, Coins, Leaf, Search, Bell, Home, Award, MapPin, Users, Settings, Trophy, BarChart3, TrendingUp, MessageSquare } from "lucide-react"
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
  const [isMounted, setIsMounted] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Search index for suggestions
  interface SearchItem {
    id: string
    type: 'page' | 'feature' | 'action'
    title: string
    description: string
    path: string
    keywords: string[]
    icon: any
    category: string
  }

  const searchIndex: SearchItem[] = [
    { id: 'home', type: 'page', title: 'Home', description: 'Return to the main dashboard', path: '/', keywords: ['home', 'dashboard', 'main'], icon: Home, category: 'Navigation' },
    { id: 'rewards', type: 'page', title: 'Rewards & Badges', description: 'View your rewards and achievements', path: '/rewards', keywords: ['rewards', 'badges', 'achievements', 'points'], icon: Award, category: 'Features' },
    { id: 'report', type: 'action', title: 'Report Waste', description: 'Submit waste and earn points', path: '/rewards/report', keywords: ['report', 'submit', 'waste', 'photo', 'upload'], icon: MapPin, category: 'Actions' },
    { id: 'leaderboard', type: 'page', title: 'Leaderboard', description: 'View top contributors', path: '/leaderboard', keywords: ['leaderboard', 'rankings', 'top', 'scores'], icon: Trophy, category: 'Community' },
    { id: 'profile', type: 'page', title: 'My Profile', description: 'View your profile and stats', path: '/profile', keywords: ['profile', 'account', 'me', 'stats'], icon: Users, category: 'Account' },
    { id: 'settings', type: 'page', title: 'Settings', description: 'Manage account preferences', path: '/settings', keywords: ['settings', 'preferences', 'privacy'], icon: Settings, category: 'Account' },
    { id: 'notifications', type: 'page', title: 'Notifications', description: 'View your notifications', path: '/notifications', keywords: ['notifications', 'alerts', 'updates'], icon: Bell, category: 'Updates' },
    { id: 'messages', type: 'page', title: 'AI Assistant', description: 'Chat with AI for help', path: '/messages', keywords: ['messages', 'chat', 'ai', 'help', 'assistant'], icon: MessageSquare, category: 'Help' },
    { id: 'admin', type: 'page', title: 'Admin Dashboard', description: 'Access admin panel', path: '/admin', keywords: ['admin', 'dashboard', 'management'], icon: BarChart3, category: 'Admin' },
    { id: 'earn', type: 'feature', title: 'Earn Points', description: 'Submit reports to earn rewards', path: '/rewards/report', keywords: ['earn', 'points', 'tokens', 'money'], icon: TrendingUp, category: 'Features' },
  ]

  // Get search suggestions based on query
  const getSearchSuggestions = (query: string): SearchItem[] => {
    if (!query.trim()) return []
    const lowerQuery = query.toLowerCase().trim()
    return searchIndex.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery)
      const descMatch = item.description.toLowerCase().includes(lowerQuery)
      const keywordMatch = item.keywords.some(kw => kw.includes(lowerQuery))
      return titleMatch || descMatch || keywordMatch
    }).slice(0, 6)
  }

  // Check if we're on auth pages
  const isAuthPage = pathname?.startsWith('/auth/')

  // Track component mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

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

  // Search functionality
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or perform search action
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(e as any);
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

        {isMounted && !isMobile && (
          <div className="flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search for rewards, tasks, or locations..."
                className={cn(
                  "w-full px-4 py-2 border rounded-full focus:outline-none transition-all duration-200",
                  isSearchFocused
                    ? "border-green-500 ring-2 ring-green-200 bg-white"
                    : "border-gray-300 bg-gray-50 hover:bg-white"
                )}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors duration-200"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Search Suggestions Dropdown */}
              {isSearchFocused && searchQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                  {getSearchSuggestions(searchQuery).length > 0 ? (
                    <div className="py-2">
                      <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Quick Navigation
                      </div>
                      {getSearchSuggestions(searchQuery).map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            router.push(item.path)
                            setSearchQuery('')
                            setIsSearchFocused(false)
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-green-50 flex items-center gap-3 transition-colors"
                        >
                          <div className={`p-2 rounded-lg ${item.type === 'page' ? 'bg-blue-100 text-blue-600' :
                            item.type === 'feature' ? 'bg-green-100 text-green-600' :
                              'bg-purple-100 text-purple-600'
                            }`}>
                            {item.icon && <item.icon className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No results for "{searchQuery}"</p>
                      <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
                    </div>
                  )}
                </div>
              )}

              {/* Popular suggestions when focused but empty */}
              {isSearchFocused && searchQuery.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="py-2">
                    <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Popular Pages
                    </div>
                    {[
                      { title: 'Report Waste', path: '/rewards/report', desc: 'Submit waste and earn points' },
                      { title: 'View Rewards', path: '/rewards', desc: 'Check your badges and achievements' },
                      { title: 'Leaderboard', path: '/leaderboard', desc: 'See top contributors' },
                      { title: 'My Profile', path: '/profile', desc: 'View your stats and info' },
                    ].map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          router.push(item.path)
                          setIsSearchFocused(false)
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-green-50 flex items-center gap-3 transition-colors"
                      >
                        <Search className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          <div className="text-xs text-gray-500">{item.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isMounted && isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/search')}
              className="hover:bg-green-50"
            >
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
              {!isMounted || isLoading ? (
                <Button
                  onClick={() => router.push('/auth/signin')}
                  variant="default"
                  className="ml-2"
                >
                  Sign In
                </Button>
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
