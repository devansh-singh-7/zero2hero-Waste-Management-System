'use client'
import { useState } from 'react'
import { Upload, CheckCircle, XCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VerifyWastePage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
  const [verificationResult, setVerificationResult] = useState<{
    wasteType: string;
    quantity: string;
    confidence: number;
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setVerificationStatus('verifying')
    
    setTimeout(() => {
      const mockResult = {
        wasteType: 'Plastic',
        quantity: '2.5 kg',
        confidence: 0.92
      }
      setVerificationResult(mockResult)
      setVerificationStatus('success')
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Verify Waste Collection
          </h1>
          <p className="text-gray-600 text-lg">Upload an image to verify and analyze your waste collection</p>
        </div>
        
        {/* Main Content Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Upload Section */}
            <div className="mb-8">
              <label htmlFor="waste-image" className="block text-lg font-semibold text-gray-800 mb-4 text-center">
                Upload Waste Image
              </label>
              
              {/* Enhanced Upload Area */}
              <div className="relative group">
                <div className="border-2 border-dashed border-green-300 rounded-2xl p-8 md:p-12 bg-gradient-to-br from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 transition-all duration-300 group-hover:border-green-400">
                  <div className="text-center space-y-4">
                    {/* Upload Icon */}
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
                      <Upload className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    
                    {/* Upload Text */}
                    <div className="space-y-2">
                      <div className="text-gray-700">
                        <label
                          htmlFor="waste-image"
                          className="cursor-pointer font-semibold text-green-600 hover:text-green-700 transition-colors duration-200 text-base"
                        >
                          Upload a file
                        </label>
                        <span className="text-gray-500"> or drag and drop</span>
                      </div>
                      <p className="text-sm text-gray-500 bg-white/50 rounded-full px-4 py-1 inline-block">
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
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Image Preview</h3>
                <div className="flex justify-center">
                  <div className="relative group max-w-md w-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                    <img 
                      src={preview} 
                      alt="Waste preview" 
                      className="relative w-full h-auto max-h-96 object-cover rounded-2xl shadow-lg border-4 border-white"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="flex justify-center">
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-48"
                disabled={!file || verificationStatus === 'verifying'}
              >
                {verificationStatus === 'verifying' ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    Verify Waste
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Results Section */}
          {verificationStatus === 'success' && verificationResult && (
            <div className="mx-8 mb-8 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-800 mb-4">Verification Successful!</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-green-700">
                    <div className="bg-white/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold">{verificationResult.wasteType}</div>
                      <div className="text-sm font-medium">Waste Type</div>
                    </div>
                    <div className="bg-white/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold">{verificationResult.quantity}</div>
                      <div className="text-sm font-medium">Quantity</div>
                    </div>
                    <div className="bg-white/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold">{(verificationResult.confidence * 100).toFixed(1)}%</div>
                      <div className="text-sm font-medium">Confidence</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {verificationStatus === 'failure' && (
            <div className="mx-8 mb-8 bg-gradient-to-r from-red-100 to-orange-100 border border-red-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-800 mb-2">Verification Failed</h3>
                  <p className="text-red-700">
                    Unable to verify the waste in this image. Please try again with a clearer, well-lit photo showing the waste clearly.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}