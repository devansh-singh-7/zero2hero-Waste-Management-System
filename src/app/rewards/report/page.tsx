'use client';

import { useState, useCallback } from 'react'
import { MapPin, Upload, CheckCircle, Loader, Camera, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import AuthGuard from '@/components/AuthGuard'
import dynamic from 'next/dynamic'

// Import LocationPicker dynamically to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <Loader className="h-8 w-8 animate-spin text-green-500 mx-auto mb-2" />
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  )
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

// Step type
type Step = 1 | 2 | 3 | 4;

// Step indicator component
function StepIndicator({ currentStep, totalSteps }: { currentStep: Step; totalSteps: number }) {
  const steps = [
    { num: 1, label: 'Upload', icon: Camera },
    { num: 2, label: 'Verify', icon: Sparkles },
    { num: 3, label: 'Location', icon: MapPin },
    { num: 4, label: 'Submit', icon: CheckCircle },
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.slice(0, totalSteps).map((step, index) => {
        const isActive = currentStep === step.num;
        const isCompleted = currentStep > step.num;
        const Icon = step.icon;

        return (
          <div key={step.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                ${isActive ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200 scale-110' :
                  isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}
              `}>
                {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
              </div>
              <span className={`text-xs mt-2 font-medium ${isActive ? 'text-green-600' : isCompleted ? 'text-green-500' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {index < totalSteps - 1 && (
              <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${currentStep > step.num ? 'bg-green-500' : 'bg-gray-200'
                }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ReportPage() {
  return (
    <AuthGuard>
      <ReportPageContent />
    </AuthGuard>
  );
}

function ReportPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requireAuth = useCallback((action: string) => {
    if (!user) {
      toast.error(`Please sign in to ${action}`);
      router.push('/auth/signin?from=' + encodeURIComponent(window.location.pathname));
      return false;
    }
    return true;
  }, [user, router]);

  const handleLocationSelect = useCallback((loc: { lat: number; lng: number }) => {
    setLocation(loc);
    toast.success('Location selected successfully');
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
      // Auto advance to verify step
      setTimeout(() => setCurrentStep(2), 500);
    }
  }, []);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleVerify = async () => {
    if (!requireAuth('verify waste')) return;

    if (!file) {
      toast.error('Please upload an image first');
      setCurrentStep(1);
      return;
    }

    setVerificationStatus('verifying');

    try {
      const base64Data = await readFileAsBase64(file);

      const response = await fetch('/api/verify-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      const normalizedResult: VerificationResult = {
        wasteType: typeof result.wasteType === 'string' ? result.wasteType.trim() : '',
        quantity: typeof result.quantity === 'string' ? result.quantity.trim() : '',
        confidence: typeof result.confidence === 'number'
          ? Math.max(0, Math.min(1, result.confidence)) : 0.5,
        hazards: typeof result.hazards === 'string' ? result.hazards.trim() : 'None'
      };

      if (!normalizedResult.wasteType) throw new Error('Waste type not detected');
      if (!normalizedResult.quantity) throw new Error('Quantity not detected');

      setVerificationResult(normalizedResult);
      setVerificationStatus('success');
      toast.success('Waste verified successfully!');
      // Auto advance to location step
      setTimeout(() => setCurrentStep(3), 800);
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('failure');
      toast.error(error instanceof Error ? error.message : 'Failed to verify waste');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requireAuth('submit a waste report')) return;
    if (!location) {
      toast.error('Please select a location');
      setCurrentStep(3);
      return;
    }
    if (verificationStatus !== 'success') {
      toast.error('Please verify the waste first');
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    toast.loading('Submitting your report...', { id: 'submit-toast' });

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify({
          location,
          wasteType: verificationResult?.wasteType,
          amount: verificationResult?.quantity,
          verificationResult,
          imageUrl: preview
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit report');
      }

      const data = await response.json();

      toast.success(`Report submitted! You earned ${data.pointsEarned || 10} points! 🎉`, {
        id: 'submit-toast', duration: 4000
      });

      window.dispatchEvent(new CustomEvent('balanceUpdate'));

      // Reset form
      setFile(null);
      setPreview(null);
      setLocation(null);
      setVerificationStatus('idle');
      setVerificationResult(null);
      setCurrentStep(1);

    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.', { id: 'submit-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = (step: Step): boolean => {
    switch (step) {
      case 1: return !!file;
      case 2: return verificationStatus === 'success';
      case 3: return !!location;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Report Waste
          </h1>
          <p className="text-gray-600">Help the environment and earn rewards</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={4} />

        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">

            {/* Step 1: Upload */}
            {currentStep === 1 && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                  📸 Upload Waste Image
                </h2>

                <div className="relative group cursor-pointer">
                  <div className={`border-3 border-dashed rounded-2xl p-8 md:p-12 transition-all duration-300 ${preview
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-green-400 bg-gradient-to-br from-gray-50 to-green-50 hover:from-green-50 hover:to-emerald-50'
                    }`}>
                    {preview ? (
                      <div className="text-center">
                        <img
                          src={preview}
                          alt="Waste preview"
                          className="max-h-64 mx-auto rounded-xl shadow-lg mb-4"
                        />
                        <p className="text-green-600 font-medium flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Image uploaded successfully
                        </p>
                        <button
                          type="button"
                          onClick={() => { setFile(null); setPreview(null); }}
                          className="mt-2 text-sm text-gray-500 hover:text-red-500 underline"
                        >
                          Remove and upload different image
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="h-10 w-10 text-green-600" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-700">
                            Click or drag to upload
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      id="waste-image"
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </div>
                </div>

                {file && (
                  <div className="flex justify-center mt-6">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg"
                    >
                      Continue to Verify
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Verify */}
            {currentStep === 2 && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                  🤖 AI Verification
                </h2>

                {/* Preview thumbnail */}
                {preview && (
                  <div className="flex justify-center mb-6">
                    <img src={preview} alt="Waste" className="h-32 rounded-xl shadow-md" />
                  </div>
                )}

                {verificationStatus === 'idle' && (
                  <div className="text-center">
                    <p className="text-gray-600 mb-6">
                      Our AI will analyze your image to identify the waste type and quantity
                    </p>
                    <Button
                      type="button"
                      onClick={handleVerify}
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-10 py-4 rounded-xl font-semibold flex items-center gap-3 mx-auto shadow-lg"
                    >
                      <Sparkles className="w-5 h-5" />
                      Analyze with AI
                    </Button>
                  </div>
                )}

                {verificationStatus === 'verifying' && (
                  <div className="text-center py-8">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                      <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-purple-500 animate-pulse" />
                    </div>
                    <p className="text-purple-600 font-semibold">Analyzing your image...</p>
                    <p className="text-gray-500 text-sm mt-1">This may take a few seconds</p>
                  </div>
                )}

                {verificationStatus === 'success' && verificationResult && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <span className="text-green-700 font-semibold">Verification Complete</span>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                          <p className="text-2xl font-bold text-green-700">{verificationResult.wasteType}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Type</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                          <p className="text-2xl font-bold text-blue-700">{verificationResult.quantity}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Quantity</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                          <p className="text-2xl font-bold text-purple-700">{(verificationResult.confidence * 100).toFixed(0)}%</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Confidence</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg"
                      >
                        Continue to Location
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {verificationStatus === 'failure' && (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">❌</span>
                    </div>
                    <p className="text-red-600 font-medium mb-4">Verification failed</p>
                    <Button
                      type="button"
                      onClick={handleVerify}
                      className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-xl"
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                <div className="flex justify-start mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Upload
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {currentStep === 3 && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                  📍 Select Location
                </h2>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="h-[350px] rounded-xl overflow-hidden">
                    <LocationPicker
                      onLocationSelect={handleLocationSelect}
                      initialLocation={location || undefined}
                    />
                  </div>
                </div>

                {location && (
                  <div className="text-center mb-6">
                    <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                      <MapPin className="w-4 h-4" />
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  {location && (
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg"
                    >
                      Review & Submit
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                  ✅ Review & Submit
                </h2>

                <div className="space-y-4 mb-8">
                  {/* Summary Card */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Image Preview */}
                      <div className="flex flex-col items-center">
                        {preview && (
                          <img src={preview} alt="Waste" className="h-40 rounded-xl shadow-md mb-2" />
                        )}
                        <p className="text-sm text-gray-500">Uploaded Image</p>
                      </div>

                      {/* Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-green-200">
                          <span className="text-gray-600">Waste Type</span>
                          <span className="font-semibold text-green-700">{verificationResult?.wasteType}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-green-200">
                          <span className="text-gray-600">Quantity</span>
                          <span className="font-semibold text-blue-700">{verificationResult?.quantity}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-green-200">
                          <span className="text-gray-600">Confidence</span>
                          <span className="font-semibold text-purple-700">{(verificationResult?.confidence || 0) * 100}%</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Location</span>
                          <span className="font-semibold text-gray-700 text-sm">
                            {location?.lat.toFixed(4)}, {location?.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rewards Preview */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-200 text-center">
                    <p className="text-amber-800">
                      🎉 You'll earn approximately <strong>10 points</strong> for this report!
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white px-10 py-4 rounded-xl font-bold flex items-center gap-3 shadow-xl text-lg disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Tips Card */}
        <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
          <h3 className="font-semibold text-gray-700 mb-2">💡 Tips for better reports</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Take clear photos in good lighting</li>
            <li>• Include multiple waste items in frame when possible</li>
            <li>• Be as accurate as possible with location</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
}
