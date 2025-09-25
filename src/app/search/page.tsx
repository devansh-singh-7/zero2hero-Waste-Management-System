'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, MapPin, Award, Users, Leaf, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SearchResult {
  id: string
  type: 'reward' | 'task' | 'location' | 'user'
  title: string
  description: string
  location?: string
  points?: number
  category?: string
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>('all')

  useEffect(() => {
    const query = searchParams.get('q')
    if (query) {
      setSearchQuery(query)
      performSearch(query)
    }
  }, [searchParams])

  const performSearch = async (query: string) => {
    if (!query.trim()) return
    
    setIsLoading(true)
    try {
      // Mock search results - replace with actual API call
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'reward',
          title: 'Clean Park Initiative',
          description: 'Help clean up Central Park and earn 50 points',
          location: 'Central Park, NYC',
          points: 50,
          category: 'Environment'
        },
        {
          id: '2',
          type: 'task',
          title: 'Waste Collection Task',
          description: 'Collect recyclable waste in downtown area',
          location: 'Downtown District',
          points: 30,
          category: 'Waste Management'
        },
        {
          id: '3',
          type: 'location',
          title: 'Recycling Center',
          description: 'Local recycling facility accepting various materials',
          location: '123 Green Street',
          category: 'Facility'
        }
      ]
      
      // Filter results based on search query
      const filteredResults = mockResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase()) ||
        result.location?.toLowerCase().includes(query.toLowerCase())
      )
      
      setResults(filteredResults)
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
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'reward':
        return <Award className="h-5 w-5 text-yellow-500" />
      case 'task':
        return <Leaf className="h-5 w-5 text-green-500" />
      case 'location':
        return <MapPin className="h-5 w-5 text-blue-500" />
      case 'user':
        return <Users className="h-5 w-5 text-purple-500" />
      default:
        return <Search className="h-5 w-5 text-gray-500" />
    }
  }

  const filters = [
    { key: 'all', label: 'All Results' },
    { key: 'reward', label: 'Rewards' },
    { key: 'task', label: 'Tasks' },
    { key: 'location', label: 'Locations' }
  ]

  const filteredResults = activeFilter === 'all' 
    ? results 
    : results.filter(result => result.type === activeFilter)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Search</h1>
          <form onSubmit={handleSearch} className="relative mb-6">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for rewards, tasks, or locations..."
              className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>

          {/* Filter Tabs */}
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
                Found {filteredResults.length} results for "{searchParams.get('q')}"
              </p>
              <div className="space-y-4">
                {filteredResults.map((result) => (
                  <Card key={result.id} className="hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getIcon(result.type)}
                            <span className="text-sm text-gray-500 capitalize">{result.type}</span>
                            {result.category && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {result.category}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">{result.title}</h3>
                          <p className="text-gray-600 mb-2">{result.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {result.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {result.location}
                              </div>
                            )}
                            {result.points && (
                              <div className="flex items-center gap-1">
                                <Award className="h-4 w-4" />
                                {result.points} points
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="ml-4">
                          View <ArrowRight className="h-4 w-4 ml-1" />
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
                We couldn't find anything matching "{searchQuery}". Try different keywords or browse our categories.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => router.push('/rewards')}>
                  Browse Rewards
                </Button>
                <Button variant="outline" onClick={() => router.push('/collect')}>
                  View Tasks
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
              <p className="text-gray-500">
                Enter keywords to find rewards, tasks, locations, and more.
              </p>
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