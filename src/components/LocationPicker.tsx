'use client'

import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { MapPin, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import 'leaflet/dist/leaflet.css'

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void
  initialLocation?: { lat: number; lng: number }
}

const markerIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [12, 41]
});

// Component to handle map centering
function MapCenterHandler({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}

function LocationMarker({ onLocationSelect, selectedLocation, setMapCenter }: { 
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  selectedLocation: { lat: number; lng: number } | null;
  setMapCenter: (center: [number, number]) => void;
}) {
  const map = useMapEvents({
    click(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      // Center the map on the clicked location
      setMapCenter([newPos.lat, newPos.lng]);
      map.setView([newPos.lat, newPos.lng], map.getZoom());
      onLocationSelect(newPos);
    },
  });

  return selectedLocation ? (
    <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={markerIcon} />
  ) : null;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [searchInput, setSearchInput] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : [20.5937, 78.9629] // Default to India center
  )
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  )

  // Remove automatic geolocation - users must click button to get location

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapCenter([userLoc.lat, userLoc.lng]);
        setSelectedLocation(userLoc);
        onLocationSelect(userLoc);
        setIsGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        setMapCenter([location.lat, location.lng]);
        setSelectedLocation(location);
        onLocationSelect(location);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
      setSuggestions([]); // Clear suggestions after search
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const location = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    };
    setMapCenter([location.lat, location.lng]);
    setSelectedLocation(location);
    onLocationSelect(location);
    setSearchInput(suggestion.display_name);
    setSuggestions([]); // Clear suggestions after selection
  };

  return (
    <div className="h-full">
      {/* Location Selection Buttons */}
      <div className="mb-3 flex gap-2">
        <Button
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
          size="sm"
        >
          <MapPin className="h-4 w-4" />
          {isGettingLocation ? 'Getting Location...' : 'Use My Location'}
        </Button>
        {selectedLocation && (
          <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
            <MapPin className="h-3 w-3 mr-1" />
            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </div>
        )}
      </div>

      <div className="relative mb-2 flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              searchLocations(e.target.value);
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for a location or click on the map"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2"
          size="sm"
        >
          {isSearching ? 'Searching...' : <Search className="h-4 w-4" />}
        </Button>
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-300 h-[calc(100%-120px)]">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapCenterHandler center={mapCenter} />
          <LocationMarker 
            selectedLocation={selectedLocation}
            setMapCenter={setMapCenter}
            onLocationSelect={(loc) => {
              setSelectedLocation(loc);
              onLocationSelect(loc);
            }} 
          />
        </MapContainer>
      </div>
    </div>
  )
}














