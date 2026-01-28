'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, MapPin, Award, Users, Leaf, ArrowRight, TrendingUp, Home, Settings, BarChart3, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SearchResult {
  id: string
  type: 'page' | 'feature' | 'action'
  title: string
  description: string
  path: string
  keywords: string[]
  icon?: any
  category?: string
}

interface Suggestion {
  text: string
  type: 'keyword' | 'page'
  path?: string
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Comprehensive search index
  const searchIndex: SearchResult[] = [
    // Main Pages
    {
      id: 'home',
      type: 'page',
      title: 'Home',
      description: 'Return to the main dashboard and overview',
      path: '/',
      keywords: ['home', 'dashboard', 'main', 'start', 'overview'],
      icon: Home,
      category: 'Navigation'
    },
    {
      id: 'rewards',
      type: 'page',
      title: 'Rewards & Badges',
      description: 'View your rewards, badges, and achievements',
      path: '/rewards',
      keywords: ['rewards', 'badges', 'achievements', 'points', 'earn', 'prizes', 'trophy'],
      icon: Award,
      category: 'Features'
    },
    {
      id: 'report',
      type: 'page',
      title: 'Report Waste',
      description: 'Submit a new waste report and earn points',
      path: '/rewards/report',
      keywords: ['report', 'submit', 'waste', 'garbage', 'trash', 'photo', 'upload', 'verify'],
      icon: MapPin,
      category: 'Actions'
    },
    {
      id: 'leaderboard',
      type: 'page',
      title: 'Leaderboard',
      description: 'View top contributors and rankings',
      path: '/leaderboard',
      keywords: ['leaderboard', 'rankings', 'top', 'users', 'best', 'champions', 'scores'],
      icon: Trophy,
      category: 'Community'
    },
    {
      id: 'profile',
      type: 'page',
      title: 'My Profile',
      description: 'View and edit your profile information',
      path: '/profile',
      keywords: ['profile', 'account', 'me', 'my', 'user', 'personal', 'info'],
      icon: Users,
      category: 'Account'
    },
    {
      id: 'settings',
      type: 'page',
      title: 'Settings',
      description: 'Manage your account settings and preferences',
      path: '/settings',
      keywords: ['settings', 'preferences', 'privacy', 'notifications', 'account settings'],
      icon: Settings,
      category: 'Account'
    },
    {
      id: 'notifications',
      type: 'page',
      title: 'Notifications',
      description: 'View your notifications and updates',
      path: '/notifications',
      keywords: ['notifications', 'alerts', 'updates', 'messages', 'inbox'],
      icon: Award,
      category: 'Updates'
    },
    {
      id: 'messages',
      type: 'page',
      title: 'AI Assistant',
      description: 'Chat with AI assistant for help and information',
      path: '/messages',
      keywords: ['messages', 'chat', 'help', 'ai', 'assistant', 'support', 'ask'],
      icon: Users,
      category: 'Help'
    },
    // Admin Pages
    {
      id: 'admin',
      type: 'page',
      title: 'Admin Dashboard',
      description: 'Access admin panel and management tools',
      path: '/admin',
      keywords: ['admin', 'dashboard', 'management', 'control panel'],
      icon: BarChart3,
      category: 'Admin'
    },
    {
      id: 'admin-users',
      type: 'page',
      title: 'User Management',
      description: 'Manage users and accounts',
      path: '/admin/users',
      keywords: ['users', 'manage users', 'accounts', 'admin users'],
      icon: Users,
      category: 'Admin'
    },
    {
      id: 'admin-collections',
      type: 'page',
      title: 'Waste Collections',
      description: 'Manage waste collection tasks',
      path: '/admin/collections',
      keywords: ['collections', 'tasks', 'waste management', 'admin collections'],
      icon: Leaf,
      category: 'Admin'
    },
    {
      id: 'admin-analytics',
      type: 'page',
      title: 'Analytics',
      description: 'View system analytics and reports',
      path: '/admin/analytics',
      keywords: ['analytics', 'reports', 'statistics', 'data', 'insights'],
      icon: BarChart3,
      category: 'Admin'
    },
    // Features
    {
      id: 'earn-points',
      type: 'feature',
      title: 'Earn Points',
      description: 'Submit waste reports to earn points and rewards',
      path: '/rewards/report',
      keywords: ['earn', 'points', 'tokens', 'balance', 'money', 'rewards'],
      icon: Award,
      category: 'Features'
    },
    {
      id: 'view-balance',
      type: 'feature',
      title: 'View Balance',
      description: 'Check your current point balance',
      path: '/profile',
      keywords: ['balance', 'points', 'tokens', 'wallet', 'earnings'],
      icon: TrendingUp,
      category: 'Features'
    }
  ]

  useEffect(() => {
    const query = searchParams.get('q')
    if (query) {
      setSearchQuery(query)
      performSearch(query)
    }
  }, [searchParams])

  // Generate suggestions based on input
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim()
      const matches: Suggestion[] = []

      // Find matching pages
      searchIndex.forEach(item => {
        const titleMatch = item.title.toLowerCase().includes(query)
        const keywordMatch = item.keywords.some(kw => kw.includes(query))
        
        if (titleMatch || keywordMatch) {
          matches.push({
            text: item.title,
            type: 'page',
            path: item.path
          })
        }
      })

      // Add keyword suggestions
      const keywords = new Set<string>()
      searchIndex.forEach(item => {
        item.keywords.forEach(kw => {
          if (kw.includes(query) && kw !== query) {
            keywords.add(kw)
          }
        })
      })

      keywords.forEach(kw => {
        if (matches.length < 8) {
          matches.push({
            text: kw,
            type: 'keyword'
          })
        }
      })

      setSuggestions(matches.slice(0, 8))
      setShowSuggestions(matches.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery])

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }
    
    setIsLoading(true)
    try {
      const lowerQuery = query.toLowerCase().trim()
      
      // Search through the index
      const matchedResults = searchIndex.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(lowerQuery)
        const descMatch = item.description.toLowerCase().includes(lowerQuery)
        const keywordMatch = item.keywords.some(kw => kw.includes(lowerQuery))
        
        return titleMatch || descMatch || keywordMatch
      })
      
      // Sort by relevance (exact matches first)
      matchedResults.sort((a, b) => {
        const aExact = a.title.toLowerCase() === lowerQuery || a.keywords.includes(lowerQuery)
        const bExact = b.title.toLowerCase() === lowerQuery || b.keywords.includes(lowerQuery)
        
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        return 0
      })
      
      setResults(matchedResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      performSearch(searchQuery.trim())
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'page' && suggestion.path) {
      router.push(suggestion.path)
    } else {
      setSearchQuery(suggestion.text)
      router.push(`/search?q=${encodeURIComponent(suggestion.text)}`)
      performSearch(suggestion.text)
    }
    setShowSuggestions(false)
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(result.path)
  }

  const getIcon = (result: SearchResult) => {
    const Icon = result.icon || Search
    const colors = {
      page: 'text-blue-500',
      feature: 'text-green-500',
      action: 'text-purple-500'
    }
    return <Icon className={`h-5 w-5 ${colors[result.type]}`} />
  }

  const filters = [
    { key: 'all', label: 'All Results' },
    { key: 'page', label: 'Pages' },
    { key: 'feature', label: 'Features' },
    { key: 'action', label: 'Actions' }
  ]

  const filteredResults = activeFilter === 'all' 
    ? results 
    : results.filter(result => result.type === activeFilter)

  // Popular searches
  const popularSearches = ['rewards', 'report waste', 'leaderboard', 'profile', 'earn points', 'badges']

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Search</h1>
          <form onSubmit={handleSearch} className="relative mb-6">
            <Input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search for pages, features, or actions..."
              className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Search className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{suggestion.text}</span>
                      {suggestion.type === 'page' && (
                        <ArrowRight className="h-3 w-3 text-gray-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Popular Searches */}
          {!searchQuery && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchQuery(term)
                      router.push(`/search?q=${encodeURIComponent(term)}`)
                      performSearch(term)
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          {results.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {filters.map((filter) => (
                <Button
                  key={filter.key}
                  variant={activeFilter === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.key)}
                  className={`whitespace-nowrap ${
                    activeFilter === filter.key 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "hover:bg-green-50"
                  }`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Search Results */}
        <div>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Searching...</p>
            </div>
          ) : filteredResults.length > 0 ? (
            <>
              <p className="text-gray-600 mb-4">
                Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for "{searchParams.get('q')}"
              </p>
              <div className="space-y-4">
                {filteredResults.map((result) => (
                  <Card 
                    key={result.id} 
                    className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => handleResultClick(result)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getIcon(result)}
                            <span className="text-sm text-gray-500 capitalize">{result.type}</span>
                            {result.category && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {result.category}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">{result.title}</h3>
                          <p className="text-gray-600 mb-2">{result.description}</p>
                          <div className="text-xs text-gray-400 mt-2">
                            {result.path}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-4"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleResultClick(result)
                          }}
                        >
                          Go <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : searchQuery ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 mb-4">
                We couldn't find anything matching "{searchQuery}". Try different keywords.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button variant="outline" onClick={() => router.push('/rewards')}>
                  Browse Rewards
                </Button>
                <Button variant="outline" onClick={() => router.push('/leaderboard')}>
                  View Leaderboard
                </Button>
                <Button variant="outline" onClick={() => router.push('/rewards/report')}>
                  Report Waste
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
              <p className="text-gray-500 mb-4">
                Enter keywords to find pages, features, and actions.
              </p>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/rewards')}>
                  <CardContent className="p-4 text-center">
                    <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Rewards</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/leaderboard')}>
                  <CardContent className="p-4 text-center">
                    <Trophy className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Leaderboard</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/profile')}>
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Profile</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Search className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Loading search...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}