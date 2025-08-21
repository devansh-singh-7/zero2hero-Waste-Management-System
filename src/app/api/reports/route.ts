import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/customAuth'
import { createReport, getRecentReports, getWasteCollectionTasks } from '@/utils/db/actions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    let data
    if (type === 'recent') {
      const limit = parseInt(searchParams.get('limit') || '10')
      data = await getRecentReports(limit)
    } else if (type === 'tasks') {
      // For tasks, we still need authentication
      const user = await getAuthUser(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const limit = parseInt(searchParams.get('limit') || '20')
      data = await getWasteCollectionTasks(limit)
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location, wasteType, amount, imageUrl, verificationResult } = body
    
    // Validate required fields
    if (!location || !wasteType || !amount) {
      return NextResponse.json({ error: 'Missing required fields', fields: { location: !!location, wasteType: !!wasteType, amount: !!amount } }, { status: 422 })
    }

    console.log('Request body:', body);

    // Check if user is authenticated
    const user = await getAuthUser(request)
    let userId = user ? user.id : null

    console.log('User ID:', userId);

    const report = await createReport(
      userId,
      location,
      wasteType,
      amount,
      imageUrl,
      undefined,
      verificationResult
    )
    
    return NextResponse.json(report)
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as any)?.message || String(error) }, { status: 500 })
  }
}




