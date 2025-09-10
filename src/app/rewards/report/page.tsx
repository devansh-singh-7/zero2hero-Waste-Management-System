'use client';

import { useState } from 'react'
import { MapPin, Upload, CheckCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">Report Waste</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="mb-8">
          <label htmlFor="waste-image" className="block text-lg font-medium text-gray-700 mb-2">
            Upload Waste Image
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-green-500 transition-colors duration-300">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="waste-image"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
                >
                  <span>Upload a file</span>
                  <input id="waste-image" name="waste-image" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>
        
        {preview && (
          <div className="mt-4 mb-8">
            <img src={preview} alt="Waste preview" className="max-w-full h-auto rounded-xl shadow-md" />
          </div>
        )}
        
        <Button 
          type="button" 
          onClick={handleVerify} 
          className="w-full mb-8" 
          variant="secondary"
          disabled={!file || verificationStatus === 'verifying'}
        >
          {verificationStatus === 'verifying' ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
              Verifying...
            </>
          ) : 'Verify Waste'}
        </Button>

        {verificationStatus === 'success' && verificationResult && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8 rounded-r-xl">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
              <div className="w-full">
                <h3 className="text-lg font-medium text-green-800">Verification Successful</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>Waste Types Detected:</strong> {verificationResult.wasteType}</p>
                  <p><strong>Total Quantity:</strong> {verificationResult.quantity}</p>
                  <p><strong>Confidence:</strong> {(verificationResult.confidence * 100).toFixed(2)}%</p>
                  {verificationResult.hazards && verificationResult.hazards !== 'None' && (
                    <p><strong>Hazards:</strong> {verificationResult.hazards}</p>
                  )}
                  
                  {verificationResult.breakdown && Object.keys(verificationResult.breakdown).length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium">Breakdown by Category:</p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {Object.entries(verificationResult.breakdown).map(([type, amount]) => 
                          amount && amount !== 'null' && (
                            <div key={type} className="text-xs bg-white px-2 py-1 rounded">
                              <span className="capitalize font-medium">{type}:</span> {amount}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Location
          </label>
          <div className="relative rounded-md h-[400px]">
            <LocationPicker 
              onLocationSelect={handleLocationSelect} 
              initialLocation={location || undefined}
            />
          </div>
          {location && (
            <p className="mt-2 text-sm text-gray-600">
              Selected location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
          disabled={isSubmitting || verificationStatus !== 'success'}
        >
          {isSubmitting ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
              Submitting report in real-time...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Submit Report & Earn Points
            </>
          )}
        </Button>
        
        {/* Real-time Status Indicator */}
        {isSubmitting && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-blue-800 font-medium">
                Processing your report in real-time...
              </span>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              Your report will be immediately visible to collection teams
            </div>
          </div>
        )}
        
        {/* Success Status */}
        {verificationStatus === 'success' && !isSubmitting && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm text-green-800 font-medium">
                Ready to submit - Real-time processing enabled
              </span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
