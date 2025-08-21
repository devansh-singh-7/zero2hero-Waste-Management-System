'use client'
import { useState } from 'react'
import { MapPin, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string
    latitude: number
    longitude: number
  }) => void
  initialLocation?: {
    latitude: number
    longitude: number
    address: string
  }
}

export default function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [locationInput, setLocationInput] = useState(initialLocation?.address || '')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{
    display_name: string
    lat: string
    lon: string
  }>>([])

  const handleSearch = async () => {
    if (!locationInput.trim()) return
    
    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput)}&limit=5`
      )
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Error searching:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchResultSelect = (result: { display_name: string; lat: string; lon: string }) => {
    const locationData = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name
    }
    
    setLocationInput(result.display_name)
    setSearchResults([])
    onLocationSelect(locationData)
  }

  const handleManualLocation = () => {
    if (locationInput.trim()) {
      // For manual input, we'll use placeholder coordinates
      // In a real app, you might want to geocode this
      const locationData = {
        address: locationInput.trim(),
        latitude: 0, // Placeholder - you could implement geocoding here
        longitude: 0
      }
      onLocationSelect(locationData)
    }
  }

  const clearLocation = () => {
    setLocationInput('')
    setSearchResults([])
    onLocationSelect({ address: '', latitude: 0, longitude: 0 })
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="Enter waste location (e.g., street address, city, landmark)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          >
            {isSearching ? 'Searching...' : <Search className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSearchResultSelect(result)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
              >
                <div className="text-sm text-gray-800">{result.display_name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Manual Location Input */}
      {locationInput && !searchResults.length && (
        <div className="flex gap-2">
          <Button
            onClick={handleManualLocation}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl"
          >
            Use This Location
          </Button>
          <Button
            onClick={clearLocation}
            variant="outline"
            className="px-4 py-2 text-red-600 border-red-300 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
        <p>💡 <strong>How to use:</strong></p>
        <ul className="mt-2 space-y-1">
          <li>• Type a location and click search to find exact coordinates</li>
          <li>• Or type a location manually and click "Use This Location"</li>
          <li>• The selected location will be used for your waste report</li>
        </ul>
      </div>
    </div>
  )
}














