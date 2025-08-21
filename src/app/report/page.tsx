'use client'
import { useState, useEffect } from 'react'
import { MapPin, Upload, CheckCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoogleGenerativeAI } from "@google/generative-ai";
import LocationPicker from '@/components/LocationPicker'

import { toast } from 'react-hot-toast'


const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const isGeminiConfigured = typeof geminiApiKey === 'string' && geminiApiKey.trim().length > 0;

export default function ReportPage() {
  const session = null;

  const [reports, setReports] = useState<Array<{
    id: number;
    location: string;
    wasteType: string;
    amount: string;
    createdAt: string;
  }>>([]);

  const [newReport, setNewReport] = useState({
    location: '',
    type: '',
    amount: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
  const [verificationResult, setVerificationResult] = useState<{
    wasteType: string;
    quantity: string;
    confidence: number;
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLocationSelect = (location: {
    address: string
    latitude: number
    longitude: number
  }) => {
    setNewReport(prev => ({
      ...prev,
      location: location.address,
    }));
  };



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

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleVerify = async () => {
    if (!file) return

    // Check if Gemini API key is configured
    if (!isGeminiConfigured) {
      toast.error('Gemini API key not configured. Please contact administrator.');
      setVerificationStatus('failure');
      return;
    }

    setVerificationStatus('verifying')
    
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const base64Data = await readFileAsBase64(file);

      const imageParts = [
        {
          inlineData: {
            data: base64Data.split(',')[1],
            mimeType: file.type,
          },
        },
      ];

      const prompt = `You are an expert in waste management and recycling. Analyze this image and provide:
        1. The type of waste (e.g., plastic, paper, glass, metal, organic, electronic, textile, etc.)
        2. An estimate of the quantity or amount (in kg, liters, pieces, or appropriate unit)
        3. Your confidence level in this assessment (as a number between 0 and 1)
        
        Be specific about the waste type and provide realistic quantity estimates.
        If the image is unclear or doesn't show waste, indicate that.
        
        Respond in JSON format like this:
        {
          "wasteType": "specific type of waste",
          "quantity": "estimated quantity with unit",
          "confidence": confidence level as a number between 0 and 1
        }`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Clean the response text to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        const parsedResult = JSON.parse(jsonMatch[0]);
        
        if (parsedResult.wasteType && parsedResult.quantity && parsedResult.confidence !== undefined) {
          // Validate confidence is a number between 0 and 1
          const confidence = parseFloat(parsedResult.confidence);
          if (isNaN(confidence) || confidence < 0 || confidence > 1) {
            throw new Error('Invalid confidence value');
          }
          
          setVerificationResult(parsedResult);
          setVerificationStatus('success');
          setNewReport({
            ...newReport,
            type: parsedResult.wasteType,
            amount: parsedResult.quantity
          });
          
          toast.success('Waste verification successful!');
        } else {
          throw new Error('Missing required fields in response');
        }
      } catch (parseError) {
        console.error('Failed to parse JSON response:', text);
        console.error('Parse error:', parseError);
        
        // Try to extract useful information from the text response
        if (text.toLowerCase().includes('waste') || text.toLowerCase().includes('plastic') || 
            text.toLowerCase().includes('paper') || text.toLowerCase().includes('glass')) {
          toast.error('Verification completed but format was unexpected. Please check the results.');
          // Set a fallback result
          const fallbackResult = {
            wasteType: 'Unknown waste type',
            quantity: 'Unknown amount',
            confidence: 0.5
          };
          setVerificationResult(fallbackResult);
          setVerificationStatus('success');
          setNewReport({
            ...newReport,
            type: fallbackResult.wasteType,
            amount: fallbackResult.quantity
          });
        } else {
          setVerificationStatus('failure');
          toast.error('Failed to verify waste. Please try again with a clearer image.');
        }
      }
    } catch (error) {
      console.error('Error verifying waste:', error);
      setVerificationStatus('failure');
      
      if (error.message?.includes('API key')) {
        toast.error('Invalid Gemini API key. Please check configuration.');
      } else if (error.message?.includes('quota')) {
        toast.error('API quota exceeded. Please try again later.');
      } else {
        toast.error('Failed to verify waste. Please try again.');
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationStatus !== 'success') {
      toast.error('Please verify the waste before submitting.');
      return;
    }

    if (!newReport.location || !newReport.type || !newReport.amount) {
      toast.error('Please make sure all fields are filled.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: newReport.location,
          wasteType: newReport.type,
          amount: newReport.amount,
          imageUrl: preview || undefined,
          verificationResult: verificationResult ? JSON.stringify(verificationResult) : undefined
        }),
      });

      if (response.ok) {
        const report = await response.json();
        
        const formattedReport = {
          id: report.id,
          location: report.location,
          wasteType: report.wasteType,
          amount: report.amount,
          createdAt: report.createdAt.toISOString().split('T')[0]
        };
        
        setReports([formattedReport, ...reports]);
        setNewReport({ location: '', type: '', amount: '' });
        setFile(null);
        setPreview(null);
        setVerificationStatus('idle');
        setVerificationResult(null);
        
        toast.success(`Report submitted successfully! Thank you for helping keep our environment clean.`);
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/reports?type=recent');
        if (response.ok) {
          const recentReports = await response.json();
          const formattedReports = recentReports.map((report: any) => ({
            ...report,
            createdAt: report.createdAt.toISOString().split('T')[0]
          }));
          setReports(formattedReports);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    // Fetch reports regardless of authentication status
    fetchReports();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">Report waste</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg mb-12">
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
          className="w-full mb-8 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl transition-colors duration-300" 
          disabled={!file || verificationStatus === 'verifying'}
        >
          {verificationStatus === 'verifying' ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Analyzing waste with AI...
            </>
          ) : 'Verify Waste with AI'}
        </Button>
        
        {!isGeminiConfigured && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center">
              <div className="text-yellow-800">
                <p className="font-medium">⚠️ Gemini API Not Configured</p>
                <p className="text-sm mt-1">Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables to enable AI waste verification.</p>
              </div>
            </div>
          </div>
        )}

        {verificationStatus === 'success' && verificationResult && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8 rounded-r-xl">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-green-800">Verification Successful</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Waste Type: {verificationResult.wasteType}</p>
                  <p>Quantity: {verificationResult.quantity}</p>
                  <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Waste Location</label>
          <LocationPicker onLocationSelect={handleLocationSelect} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Waste Type</label>
            <input
              type="text"
              id="type"
              name="type"
              value={newReport.type}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder="Verified waste type"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Estimated Amount</label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={newReport.amount}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder="Verified amount"
              readOnly
            />
          </div>
        </div>
        <Button 
          type="submit" 
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg rounded-xl transition-colors duration-300 flex items-center justify-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Submitting...
            </>
          ) : 'Submit Report'}
        </Button>
      </form>

      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Recent Reports</h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <MapPin className="inline-block w-4 h-4 mr-2 text-green-500" />
                    {report.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.wasteType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}