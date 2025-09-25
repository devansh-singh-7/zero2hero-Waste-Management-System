'use client';

import { useState } from 'react'
import { MapPin, Upload, CheckCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import dynamic from 'next/dynamic'

// Import LocationPicker dynamically to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
})
// For type safety with the verification result
interface VerificationResult {
  wasteType: string;
  quantity: string;
  confidence: number;
  hazards?: string;
  breakdown?: {
    plastic?: string;
    paper?: string;
    glass?: string;
    metal?: string;
    organic?: string;
    electronic?: string;
    textile?: string;
    other?: string;
  };
}

export default function ReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requireAuth = (action: string) => {
    if (!user) {
      toast.error(`Please sign in to ${action}`);
      router.push('/auth/signin?from=' + encodeURIComponent(window.location.pathname));
      return false;
    }
    return true;
  };

  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    setLocation(location);
    toast.success('Location selected successfully');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleVerify = async () => {
    // Check authentication before allowing verification
    if (!requireAuth('verify waste')) {
      return;
    }
    
    if (!file) {
      toast.error('Please upload an image first');
      return;
    }

    setVerificationStatus('verifying');
    
    try {
      // Read and prepare the image
      const base64Data = await readFileAsBase64(file);
      
      // Call our API endpoint
      const response = await fetch('/api/verify-waste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64Data.split(',')[1],
          mimeType: file.type || 'image/jpeg'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify waste');
      }

      const result = await response.json();
      
      // Validate and normalize the result
      const normalizedResult: VerificationResult = {
        wasteType: typeof result.wasteType === 'string' ? result.wasteType.trim() : '',
        quantity: typeof result.quantity === 'string' ? result.quantity.trim() : '',
        confidence: typeof result.confidence === 'number' 
          ? Math.max(0, Math.min(1, result.confidence))
          : 0.5,
        hazards: typeof result.hazards === 'string' ? result.hazards.trim() : 'None'
      };

      // Validate required fields
      if (!normalizedResult.wasteType) {
        throw new Error('Waste type is required but was not provided');
      }
      if (!normalizedResult.quantity) {
        throw new Error('Quantity is required but was not provided');
      }
      
      setVerificationResult(normalizedResult);
      setVerificationStatus('success');
      toast.success('Waste verified successfully!');
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('failure');
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
        toast.error('API key not configured. Please check your environment setup.');
      } else if (error instanceof Error && error.message.includes('model')) {
        toast.error('AI model unavailable. Please try again later.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to verify waste');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication before allowing submission
    if (!requireAuth('submit a waste report')) {
      return;
    }
    
    if (!location) {
      toast.error('Please enter a location');
      return;
    }
    if (verificationStatus !== 'success') {
      toast.error('Please verify the waste first');
      return;
    }
    
    setIsSubmitting(true);
    
    // Show immediate feedback
    toast.loading('Submitting your report...', { id: 'submit-toast' });
    
    try {
      // Submit the report to the API with cache-busting
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          location: location,
          wasteType: verificationResult?.wasteType,
          amount: verificationResult?.quantity,
          verificationResult: verificationResult,
          imageUrl: preview // Include the image preview URL
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit report');
      }

      const data = await response.json();
      
      // Show success with points earned
      toast.success(
        `Report submitted successfully! You earned ${data.pointsEarned || 10} points! 🎉`, 
        { 
          id: 'submit-toast',
          duration: 4000 
        }
      );
      
      // Trigger balance update in header
      window.dispatchEvent(new CustomEvent('balanceUpdate'));
      
      // Additional real-time feedback
      setTimeout(() => {
        toast.success('Your report is now visible to collection teams!', {
          duration: 3000
        });
      }, 1000);
      
      // Reset form
      setFile(null);
      setPreview(null);
      setLocation(null);
      setVerificationStatus('idle');
      setVerificationResult(null);
      
      // Reset file input
      const fileInput = document.getElementById('waste-image') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.', { id: 'submit-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Report Waste
          </h1>
          <p className="text-gray-600 text-lg">Upload, verify, and report waste to earn rewards while helping the environment</p>
        </div>
        
        {/* Main Content Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            
            {/* Upload Section */}
            <div className="mb-10">
              <label htmlFor="waste-image" className="block text-xl font-semibold text-gray-800 mb-6 text-center">
                Upload Waste Image
              </label>
              
              {/* Enhanced Upload Area */}
              <div className="relative group">
                <div className="border-2 border-dashed border-green-300 rounded-2xl p-8 md:p-12 bg-gradient-to-br from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 transition-all duration-300 group-hover:border-green-400 group-hover:shadow-lg">
                  <div className="text-center space-y-4">
                    {/* Upload Icon */}
                    <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center group-hover:from-green-200 group-hover:to-blue-200 transition-all duration-300">
                      <Upload className="h-10 w-10 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    
                    {/* Upload Text */}
                    <div className="space-y-3">
                      <div className="text-gray-700">
                        <label
                          htmlFor="waste-image"
                          className="cursor-pointer font-bold text-lg text-green-600 hover:text-green-700 transition-colors duration-200"
                        >
                          Upload a file
                        </label>
                        <span className="text-gray-500 text-lg"> or drag and drop</span>
                      </div>
                      <p className="text-sm text-gray-500 bg-white/60 rounded-full px-6 py-2 inline-block shadow-sm">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                    
                    <input 
                      id="waste-image" 
                      name="waste-image" 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      onChange={handleFileChange} 
                      accept="image/*" 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Image Preview Section */}
            {preview && (
              <div className="mb-10">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Image Preview</h3>
                <div className="flex justify-center">
                  <div className="relative group max-w-lg w-full">
                    {/* Decorative background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 transform rotate-1"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-green-400 rounded-3xl opacity-15 group-hover:opacity-25 transition-opacity duration-300 transform -rotate-1"></div>
                    
                    {/* Main image */}
                    <div className="relative bg-white p-3 rounded-3xl shadow-xl">
                      <img 
                        src={preview} 
                        alt="Waste preview" 
                        className="w-full h-auto max-h-96 object-cover rounded-2xl shadow-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Verify Button */}
            <div className="flex justify-center mb-10">
              <Button 
                type="button" 
                onClick={handleVerify} 
                className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-64"
                disabled={!file || verificationStatus === 'verifying'}
              >
                {verificationStatus === 'verifying' ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Analyzing Waste...
                  </>
                ) : (
                  <>
                    Verify Waste with AI
                  </>
                )}
              </Button>
            </div>

            {/* Enhanced Verification Results */}
            {verificationStatus === 'success' && verificationResult && (
              <div className="mb-10 bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 border-2 border-green-200 rounded-3xl p-8 shadow-lg">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800">AI Verification Complete!</h3>
                </div>
                
                {/* Results Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center shadow-md">
                    <div className="text-3xl font-bold text-green-700 mb-2">{verificationResult.wasteType}</div>
                    <div className="text-sm font-medium text-green-600 uppercase tracking-wide">Waste Type</div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center shadow-md">
                    <div className="text-3xl font-bold text-blue-700 mb-2">{verificationResult.quantity}</div>
                    <div className="text-sm font-medium text-blue-600 uppercase tracking-wide">Quantity</div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center shadow-md">
                    <div className="text-3xl font-bold text-purple-700 mb-2">{(verificationResult.confidence * 100).toFixed(1)}%</div>
                    <div className="text-sm font-medium text-purple-600 uppercase tracking-wide">Confidence</div>
                  </div>
                </div>
                
                {/* Additional Info */}
                {verificationResult.hazards && verificationResult.hazards !== 'None' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <h4 className="font-semibold text-red-800 mb-2">Hazards Detected:</h4>
                    <p className="text-red-700">{verificationResult.hazards}</p>
                  </div>
                )}
                
                {/* Breakdown */}
                {verificationResult.breakdown && Object.keys(verificationResult.breakdown).length > 0 && (
                  <div className="bg-white/50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 text-center">Breakdown by Category</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(verificationResult.breakdown).map(([type, amount]) => 
                        amount && amount !== 'null' && (
                          <div key={type} className="bg-white rounded-lg px-3 py-2 text-center shadow-sm">
                            <div className="text-xs font-medium text-gray-500 uppercase">{type}</div>
                            <div className="text-sm font-bold text-gray-800">{amount}</div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Location Section */}
            <div className="mb-10">
              <label className="block text-xl font-semibold text-gray-800 mb-6 text-center">
                Select Collection Location
              </label>
              <div className="bg-white rounded-3xl p-4 shadow-lg border-2 border-gray-100">
                <div className="relative rounded-2xl h-[400px] overflow-hidden">
                  <LocationPicker 
                    onLocationSelect={handleLocationSelect} 
                    initialLocation={location || undefined}
                  />
                </div>
                {location && (
                  <div className="mt-4 text-center">
                    <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                      Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-center">
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 min-w-80"
                disabled={isSubmitting || verificationStatus !== 'success'}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-3 h-6 w-6" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-3 h-6 w-6" />
                    Submit Report & Earn Rewards
                  </>
                )}
              </Button>
            </div>
            
            {/* Status Indicators */}
            {isSubmitting && (
              <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl shadow-lg">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-lg text-blue-800 font-semibold">
                    Processing Your Report...
                  </span>
                </div>
                <div className="text-center text-sm text-blue-600">
                  Your report is being processed in real-time and will be immediately visible to collection teams
                </div>
              </div>
            )}
            
            {verificationStatus === 'success' && !isSubmitting && (
              <div className="mt-8 p-6 bg-green-50 border-2 border-green-200 rounded-2xl shadow-lg">
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-lg text-green-800 font-semibold">
                    Ready to Submit - Real-time Processing Enabled
                  </span>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
