'use client'
import { useEffect, useState } from 'react'
import { MapPin, Trash2, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

interface WasteCollectionMapProps {
  tasks: CollectionTask[]
  onTaskSelect: (task: CollectionTask) => void
  onStatusChange: (taskId: number, newStatus: CollectionTask['status']) => void
  user: { id: number; email: string; name: string | null } | null
}

export default function WasteCollectionMap({ 
  tasks, 
  onTaskSelect, 
  onStatusChange, 
  user 
}: WasteCollectionMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]) // Default to India center
  const [geocodedTasks, setGeocodedTasks] = useState<CollectionTask[]>([])
  const [isClient, setIsClient] = useState(false)

  // Only render on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Geocode tasks that don't have coordinates
  useEffect(() => {
    if (!isClient) return

    const geocodeTasks = async () => {
      const tasksWithCoords = await Promise.all(
        tasks.map(async (task) => {
          if (task.latitude && task.longitude) {
            return task
          }
          
          try {
            // Use Nominatim to geocode the location
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(task.location)}&limit=1`
            )
            const data = await response.json()
            
            if (data.length > 0) {
              return {
                ...task,
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon)
              }
            }
          } catch (error) {
            console.error(`Error geocoding ${task.location}:`, error)
          }
          
          return task
        })
      )
      
      setGeocodedTasks(tasksWithCoords.filter(task => task.latitude && task.longitude))
      
      // Update map center to first available location
      const firstTaskWithCoords = tasksWithCoords.find(task => task.latitude && task.longitude)
      if (firstTaskWithCoords) {
        setMapCenter([firstTaskWithCoords.latitude!, firstTaskWithCoords.longitude!])
      }
    }
    
    if (tasks.length > 0) {
      geocodeTasks()
    }
  }, [tasks, isClient])

  const getStatusIcon = (status: CollectionTask['status']) => {
    switch (status) {
      case 'pending':
        return '🟡'
      case 'in_progress':
        return '🔵'
      case 'completed':
        return '🟢'
      case 'verified':
        return '🟣'
      default:
        return '⚪'
    }
  }

  const getStatusColor = (status: CollectionTask['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600'
      case 'in_progress':
        return 'text-blue-600'
      case 'completed':
        return 'text-green-600'
      case 'verified':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleTaskAction = (task: CollectionTask) => {
    if (task.status === 'pending') {
      onStatusChange(task.id, 'in_progress')
    } else if (task.status === 'in_progress' && task.collectorId === user?.id) {
      onTaskSelect(task)
    }
  }

  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-500" />
            Collection Map
          </h3>
          <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">Loading map...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-500" />
          Collection Map
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          View all waste collection tasks on the map. Click on markers to see details and take action.
        </p>
        
        <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300">
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Interactive map will be displayed here</p>
              <p className="text-sm text-gray-400 mt-1">Showing {geocodedTasks.length} tasks with coordinates</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Task List for now since map is not fully implemented */}
      {geocodedTasks.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">Tasks with Coordinates</h4>
          <div className="space-y-2">
            {geocodedTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStatusIcon(task.status)}</span>
                  <div>
                    <p className="font-medium text-sm">{task.location}</p>
                    <p className="text-xs text-gray-600">{task.wasteType} • {task.amount}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleTaskAction(task)}
                  className="text-xs"
                >
                  {task.status === 'pending' ? 'Start Collection' : 'View Details'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2">Map Legend</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <span className="mr-2">🟡</span>
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">🔵</span>
            <span className="text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">🟢</span>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">🟣</span>
            <span className="text-gray-600">Verified</span>
          </div>
        </div>
      </div>
    </div>
  )
}
