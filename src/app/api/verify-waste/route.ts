import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with server-side API key
const configuration = {
  apiKey: process.env.GEMINI_API_KEY || '',
  apiVersion: "v1",
};

const genAI = new GoogleGenerativeAI(configuration.apiKey);

export async function POST(request: NextRequest) {
  try {
    // Get image data from request
    const data = await request.json();
    const { imageData, mimeType } = data;

    if (!imageData || !mimeType) {
      return NextResponse.json({ error: 'Image data and MIME type are required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Get the basic Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash"
    });

    // Create enhanced prompt for detailed waste analysis
    const prompt = `You are an expert waste management AI analyst. Analyze this image carefully and identify ALL types of waste visible. 

IMPORTANT: Respond with ONLY a valid JSON object, no markdown formatting, no code blocks, no additional text.

Provide your assessment in this exact JSON format:

{
  "wasteType": "List all waste types found (e.g., 'plastic bottles, food waste, cardboard' NOT just 'mixed')",
  "quantity": "estimated total amount with unit (e.g., '2 kg', '5 items', '1 bag')",
  "confidence": 0.XX,
  "hazards": "any potential hazards or 'None'",
  "breakdown": {
    "plastic": "amount if present or null",
    "paper": "amount if present or null", 
    "glass": "amount if present or null",
    "metal": "amount if present or null",
    "organic": "amount if present or null",
    "electronic": "amount if present or null",
    "textile": "amount if present or null",
    "other": "amount if present or null"
  }
}

Instructions:
- Look carefully at the image and identify SPECIFIC waste types
- If you see plastic bottles, say "plastic bottles" not just "plastic"
- If you see food scraps, say "food waste" not just "organic"
- If multiple types are present, list them all separated by commas
- Estimate realistic quantities based on what you can see
- Only include breakdown items that are actually visible (use null for others)
- Be specific and descriptive, avoid generic terms like "mixed waste"
- Return ONLY the JSON object, no other text or formatting`;

    // Prepare image part
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType
      }
    };

    // Generate content with both prompt and image
    const result = await model.generateContent([prompt, imagePart]);
    
    if (!result.response) {
      return NextResponse.json({ error: 'No response from AI model' }, { status: 500 });
    }

    const text = result.response.text();
    
    try {
      // Clean up response and parse JSON - improved parsing
      let cleanText = text.replace(/```json\s*|\s*```/g, '').trim();
      
      // Find the start and end of the JSON object
      const startIndex = cleanText.indexOf('{');
      const lastIndex = cleanText.lastIndexOf('}');
      
      if (startIndex === -1 || lastIndex === -1 || lastIndex <= startIndex) {
        console.error('No valid JSON found in response:', text);
        return NextResponse.json({ error: 'Invalid response format - no JSON found' }, { status: 422 });
      }

      // Extract the complete JSON string
      const jsonString = cleanText.substring(startIndex, lastIndex + 1);
      
      const parsedResult = JSON.parse(jsonString);

      // Validate and normalize result
      const normalizedResult = {
        wasteType: typeof parsedResult.wasteType === 'string' ? parsedResult.wasteType.trim() : '',
        quantity: typeof parsedResult.quantity === 'string' ? parsedResult.quantity.trim() : '',
        confidence: typeof parsedResult.confidence === 'number' 
          ? Math.max(0, Math.min(1, parsedResult.confidence))
          : 0.5,
        hazards: typeof parsedResult.hazards === 'string' ? parsedResult.hazards.trim() : 'None',
        breakdown: parsedResult.breakdown || {}
      };

      // Validate required fields
      if (!normalizedResult.wasteType || !normalizedResult.quantity) {
        return NextResponse.json({ error: 'Missing required fields in AI response' }, { status: 422 });
      }

      return NextResponse.json(normalizedResult);
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Raw text:', text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 422 });
    }
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
