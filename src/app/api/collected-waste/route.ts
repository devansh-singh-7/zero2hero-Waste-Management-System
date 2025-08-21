import { NextRequest, NextResponse } from 'next/server'
import { saveCollectedWaste } from '@/utils/db/actions'

export async function POST(request: NextRequest) {
  try {
    const { taskId, userId, verificationResult } = await request.json()
    
    const collectedWaste = await saveCollectedWaste(taskId, userId, verificationResult)
    
    if (!collectedWaste) {
      return NextResponse.json({ error: 'Failed to save collected waste' }, { status: 400 })
    }
    
    return NextResponse.json(collectedWaste)
  } catch (error) {
    console.error('Error saving collected waste:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}










