
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
    try {
        const { image, task } = await request.json();

        if (!image || !task) {
            return NextResponse.json({ error: 'Image and task details are required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analyze this image and determine if it matches the reported waste collection task:
    - Expected waste type: ${task.wasteType}
    - Expected amount: ${task.amount}
    
    Please respond with a JSON object containing:
    - wasteTypeMatch: boolean (true if the waste type matches)
    - quantityMatch: boolean (true if the quantity appears reasonable)
    - confidence: number (0-1 confidence score)
    - notes: string (brief explanation)`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: image.split(',')[1],
                    mimeType: image.split(';')[0].split(':')[1] || 'image/jpeg'
                }
            }
        ]);

        const responseText = result.response.text();
        let verificationResult = null;

        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                verificationResult = JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        return NextResponse.json({ verificationResult });

    } catch (error) {
        console.error('Error verifying collection:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
