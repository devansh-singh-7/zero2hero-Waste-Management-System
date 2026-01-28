'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import { MapPin, Trash2, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import 'leaflet/dist/leaflet.css'

interface CollectionTask {
  id: number
  location: string
  wasteType: string
  amount: string
  status: 'pending' | 'in_progress' | 'completed' | 'verified'
  date: string
  collectorId: number | null
  latitude?: number
  longitude?: number
}

interface User {
  id: number;
  email: string;
  name?: string;
}

interface WasteCollectionMapProps {
  tasks: CollectionTask[]
  onTaskSelect: (task: CollectionTask) => void
  onStatusChange: (taskId: number, newStatus: CollectionTask['status']) => void
  user: User | null
}

const parseLocation = (location: string) => {
  try {
    const [lat, lng] = location.split(',').map(coord => Number(coord.trim()));
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('Invalid coordinates:', { lat, lng });
      return null;
    }
    
    return { lat, lng };
  } catch (error) {
    console.error('Error parsing location:', error);
    return null;
  }
};

const createIcon = (color: string) => new Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [12, 41]
});

const icons = {
  pending: createIcon('yellow'),
  in_progress: createIcon('blue'),
  completed: createIcon('green'),
  verified: createIcon('violet')
};

export default function WasteCollectionMap({ 
  tasks, 
  onTaskSelect, 
  onStatusChange, 
  user 
}: WasteCollectionMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]) 
  const [isClient, setIsClient] = useState(false)
  const [mapKey, setMapKey] = useState(0)

  useEffect(() => {
    setIsClient(true)
    
    return () => {
      setMapKey(prev => prev + 1)
    }
  }, [])

  useEffect(() => {
    if (tasks.length > 0) {
      const firstValidTask = tasks.find(task => {
        const coords = parseLocation(task.location)
        return coords !== null
      })

      if (firstValidTask) {
        const coords = parseLocation(firstValidTask.location)
        if (coords) {
          setMapCenter([coords.lat, coords.lng])
        }
      }
    }
  }, [tasks])

  const tasksWithCoords = tasks
    .map(task => {
      const coords = parseLocation(task.location);
      if (!coords) {
        console.warn('Invalid location format for task:', task);
        return null;
      }
      return {
        ...task,
        latitude: coords.lat,
        longitude: coords.lng
      };
    })
    .filter((task): task is CollectionTask & { latitude: number; longitude: number } => 
      task !== null && typeof task.latitude === 'number' && typeof task.longitude === 'number'
    );

  if (!isClient) {
    return (
      <div className="h-full w-full rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        key={mapKey}
        center={mapCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        whenReady={() => {
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {tasksWithCoords.map(task => (
          <Marker
            key={task.id}
            position={[task.latitude, task.longitude]}
            icon={icons[task.status]}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-medium text-lg mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {`${task.latitude.toFixed(6)}, ${task.longitude.toFixed(6)}`}
                </h3>
                <div className="text-sm space-y-1 mb-3">
                  <p className="flex items-center">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Type: {task.wasteType}
                  </p>
                  <p>Amount: {task.amount}</p>
                  <p className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Status: {task.status.replace('_', ' ')}
                  </p>
                </div>
                <div className="flex justify-end">
                  {task.status === 'pending' ? (
                    <Button
                      size="sm"
                      onClick={() => onStatusChange(task.id, 'in_progress')}
                      className="w-full"
                    >
                      Start Collection
                    </Button>
                  ) : task.status === 'in_progress' && task.collectorId === user?.id ? (
                    <Button
                      size="sm"
                      onClick={() => onTaskSelect(task)}
                      className="w-full"
                    >
                      Complete & Verify
                    </Button>
                  ) : task.status === 'in_progress' ? (
                    <span className="text-yellow-600 text-sm">In progress by another collector</span>
                  ) : (
                    <span className="text-green-600 text-sm">
                      {task.status === 'verified' ? 'Verified' : 'Completed'}
                    </span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}