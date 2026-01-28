'use client'
import { useState, useEffect } from 'react'
import { Trash2, MapPin, CheckCircle, Clock, ArrowRight, Camera, Upload, Loader, Calendar, Weight, Search, X, ArrowLeft, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { GoogleGenerativeAI } from "@google/generative-ai"
import dynamic from 'next/dynamic'
import AdminProtected from '@/components/AdminProtected'
import Link from 'next/link'

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
})

const WasteCollectionMap = dynamic(() => import('@/components/WasteCollectionMap'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
})

// Make sure to set your Gemini API key in your environment variables
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

interface VerificationResult {
  wasteTypeMatch: boolean;
  quantityMatch: boolean;
  confidence: number;
}

interface CollectionTask {
  id: number
  userId: number | null
  location: string
  wasteType: string
  amount: string
  status: 'pending' | 'in_progress' | 'completed' | 'verified'
  collectorId: number | null
  imageUrl: string | null
  verificationResult: VerificationResult | null
  createdAt: string | Date
  userName?: string | null
  userEmail?: string | null
}

const ITEMS_PER_PAGE = 5

export default function AdminCollectionsPage() {
  const [tasks, setTasks] = useState<CollectionTask[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredWasteType, setHoveredWasteType] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [adminData, setAdminData] = useState<{ id: number; email: string; name: string } | null>(null)

  // Check admin authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth/check', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setAdminData(userData.admin);
        }
      } catch (error) {
        console.error('Error checking admin auth:', error);
      }
    };
    checkAuth();
  }, []);

  // API Helpers
  const fetchTasks = async () => {
    const response = await fetch(`/api/admin/collection-tasks?t=${Date.now()}`, {
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    const data = await response.json();
    return data.tasks;
  };

  const updateTask = async (taskId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/collect', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          taskId,
          newStatus,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update task: ${errorMessage}`);
    }
  };

  const saveCollectedWasteData = async (data: any) => {
    const response = await fetch('/api/admin/collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to save collected waste data');
    }
    return response.json();
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const tasksData = await fetchTasks();
      setTasks(tasksData || []);
      if (process.env.NODE_ENV === 'development') {
        console.log('Loaded tasks:', tasksData?.length || 0);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load collection tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadTasks();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleAcceptTask = async (taskId: number) => {
    if (!adminData) {
      toast.error('Admin authentication required');
      return;
    }

    try {
      await updateTask(taskId, 'in_progress');
      
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: 'in_progress' as const, collectorId: adminData.id }
            : task
        )
      );
      
      toast.success('Task accepted! You can now collect this waste.');
    } catch (error) {
      console.error('Error accepting task:', error);
      toast.error('Failed to accept task. Please try again.');
    }
  };

  const handleCompleteTask = async (taskId: number, imageFile: File | null) => {
    if (!adminData) {
      toast.error('Admin authentication required');
      return;
    }

    try {
      let imageUrl = null;
      let verificationResult = null;

      if (imageFile) {
        // Upload image first
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadResponse = await fetch('/api/upload/image', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          imageUrl = uploadResult.imageUrl;
        } else {
          console.error('Failed to upload image');
          toast.error('Failed to upload image, but task will be completed');
        }

        // Convert image to base64 for Gemini AI verification
        const base64Image = await fileToBase64(imageFile);
        
        if (geminiApiKey) {
          const genAI = new GoogleGenerativeAI(geminiApiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

          const task = tasks.find(t => t.id === taskId);
          if (task) {
            const prompt = `Analyze this image and determine if it matches the reported waste collection task:
            - Expected waste type: ${task.wasteType}
            - Expected amount: ${task.amount}
            
            Please respond with a JSON object containing:
            - wasteTypeMatch: boolean (true if the waste type matches)
            - quantityMatch: boolean (true if the quantity appears reasonable)
            - confidence: number (0-1 confidence score)
            - notes: string (brief explanation)`;

            try {
              const result = await model.generateContent([
                prompt,
                {
                  inlineData: {
                    data: base64Image.split(',')[1],
                    mimeType: imageFile.type
                  }
                }
              ]);

              const responseText = result.response.text();
              
              try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  verificationResult = JSON.parse(jsonMatch[0]);
                }
              } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
              }
            } catch (aiError) {
              console.error('Error with AI verification:', aiError);
              toast.error('AI verification failed, but task will be marked as completed');
            }
          }
        }
      }

      const response = await fetch('/api/admin/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          taskId: taskId,
          verificationResult: verificationResult,
          imageUrl: imageUrl
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete task');
      }

      const result = await response.json();
      
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { 
                ...task, 
                status: 'completed' as const, 
                imageUrl: imageUrl,
                verificationResult: verificationResult 
              }
            : task
        )
      );

      toast.success(result.message || 'Task completed successfully!');
      
      if (verificationResult && !verificationResult.wasteTypeMatch) {
        toast.error('AI detected potential mismatch in waste type - please review');
      }

      if (imageUrl) {
        toast.success('📸 Completion photo has been sent to the user\'s notifications!');
      }

      await loadTasks();

    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task. Please try again.');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const filteredTasks = tasks.filter(task =>
    task.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.wasteType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.userName && task.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (task.userEmail && task.userEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const wasteTypeColors: { [key: string]: string } = {
    'plastic': 'bg-blue-100 text-blue-800',
    'organic': 'bg-green-100 text-green-800', 
    'metal': 'bg-gray-100 text-gray-800',
    'paper': 'bg-yellow-100 text-yellow-800',
    'glass': 'bg-purple-100 text-purple-800',
    'electronic': 'bg-red-100 text-red-800',
    'mixed': 'bg-orange-100 text-orange-800',
  };

  if (loading) {
    return (
      <AdminProtected>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Trophy className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
          </div>
        </div>
      </AdminProtected>
    );
  }

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <Link href="/admin" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Trash2 className="h-6 w-6 mr-2 text-green-600" />
                  Waste Collection Management
                </h1>
                <p className="text-sm text-gray-600">Manage and track waste collection tasks</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by location or waste type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={loadTasks}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Total Reports: <strong>{tasks.length}</strong></span>
              <span>Pending: <strong>{tasks.filter(t => t.status === 'pending').length}</strong></span>
              <span>In Progress: <strong>{tasks.filter(t => t.status === 'in_progress').length}</strong></span>
            </div>
            <div className="text-xs">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="grid gap-6 mb-8">
            {paginatedTasks.length === 0 ? (
              <div className="text-center py-12">
                <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No collection tasks found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search criteria' : 'No tasks are currently available for collection'}
                </p>
              </div>
            ) : (
              paginatedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  wasteTypeColors={wasteTypeColors}
                  hoveredWasteType={hoveredWasteType}
                  setHoveredWasteType={setHoveredWasteType}
                  onAcceptTask={handleAcceptTask}
                  onCompleteTask={handleCompleteTask}
                  isAdmin={!!adminData}
                  adminId={adminData?.id}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600 mx-4">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminProtected>
  );
}

// Task Card Component
interface TaskCardProps {
  task: CollectionTask;
  wasteTypeColors: { [key: string]: string };
  hoveredWasteType: string | null;
  setHoveredWasteType: (type: string | null) => void;
  onAcceptTask: (taskId: number) => void;
  onCompleteTask: (taskId: number, imageFile: File | null) => void;
  isAdmin: boolean;
  adminId?: number;
}

function TaskCard({ 
  task, 
  wasteTypeColors, 
  hoveredWasteType, 
  setHoveredWasteType, 
  onAcceptTask, 
  onCompleteTask, 
  isAdmin,
  adminId 
}: TaskCardProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleImageUpload called');
    const file = event.target.files?.[0];
    console.log('Selected file:', file);
    if (file) {
      setIsUploading(true);
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      console.log('Image preview set:', previewUrl);
      toast.success(`Photo selected: ${file.name}`);
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    console.log('triggerFileInput called');
    const fileInput = document.getElementById(`file-input-${task.id}`) as HTMLInputElement;
    if (fileInput) {
      console.log('File input found, clicking...');
      fileInput.click();
    } else {
      console.error('File input not found');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'verified': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <ArrowRight className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">{task.location}</span>
          </div>
          
          {/* User Information */}
          {(task.userName || task.userEmail) && (
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
              <span>Reported by:</span>
              <span className="font-medium text-gray-900">
                {task.userName || 'Unknown User'}
              </span>
              {task.userEmail && (
                <span className="text-gray-500">({task.userEmail})</span>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                wasteTypeColors[task.wasteType.toLowerCase()] || 'bg-gray-100 text-gray-800'
              } ${hoveredWasteType === task.wasteType ? 'ring-2 ring-green-500' : ''}`}
              onMouseEnter={() => setHoveredWasteType(task.wasteType)}
              onMouseLeave={() => setHoveredWasteType(null)}
            >
              {task.wasteType}
            </span>
            
            <div className="flex items-center text-gray-600">
              <Weight className="h-4 w-4 mr-1" />
              <span className="text-sm">{task.amount}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="text-sm">
                {new Date(task.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(task.status)}`}>
            {getStatusIcon(task.status)}
            {task.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Verification Result */}
      {task.verificationResult && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">AI Verification Result</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Waste Type Match:</span>
              <span className={task.verificationResult.wasteTypeMatch ? 'text-green-600' : 'text-red-600'}>
                {task.verificationResult.wasteTypeMatch ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Quantity Match:</span>
              <span className={task.verificationResult.quantityMatch ? 'text-green-600' : 'text-red-600'}>
                {task.verificationResult.quantityMatch ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Confidence:</span>
              <span className="text-gray-900">{Math.round(task.verificationResult.confidence * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Selected Photo</h4>
          <div className="flex items-center gap-3">
            <img 
              src={imagePreview} 
              alt="Selected collection photo" 
              className="w-24 h-24 object-cover rounded-lg border"
            />
            <div className="text-sm text-gray-600">
              <p>Photo selected successfully!</p>
              <p>Click "Complete Task" to proceed.</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {task.status === 'pending' && isAdmin && (
          <Button
            onClick={() => onAcceptTask(task.id)}
            className="flex-1"
          >
            Accept Task
          </Button>
        )}
        
        {task.status === 'in_progress' && task.collectorId === adminId && (
          <>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id={`file-input-${task.id}`}
              />
              <Button 
                variant="outline" 
                className="w-full" 
                type="button"
                onClick={triggerFileInput}
                disabled={isUploading}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : (imageFile ? 'Change Photo' : 'Add Photo')}
              </Button>
            </div>
            
            <Button
              onClick={() => onCompleteTask(task.id, imageFile)}
              disabled={!imageFile}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Task
            </Button>
          </>
        )}
        
        {task.status === 'completed' && (
          <Button variant="outline" disabled className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Task Completed
          </Button>
        )}
      </div>
    </div>
  );
}
