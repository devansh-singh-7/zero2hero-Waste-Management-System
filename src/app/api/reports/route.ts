import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Reports, Transactions, Notifications } from '@/lib/db/schema';
import { getRecentReports, getWasteCollectionTasks } from '@/lib/db/actions';
import { auth } from '@/lib/customAuth';

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Check authentication first
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'recent';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    let responseData;
    if (type === 'recent') {
      responseData = await getRecentReports(limit);
      // Serialize dates for JSON response
      const serializedReports = responseData.map(report => ({
        ...report,
        createdAt: report.createdAt?.toISOString()
      }));
      
      const response = NextResponse.json({ 
        reports: serializedReports,
        timestamp: new Date().toISOString(),
        count: serializedReports.length
      });
      
      // Add cache-busting headers
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    } else if (type === 'tasks' || type === 'collection') {
      responseData = await getWasteCollectionTasks(limit);
      const response = NextResponse.json({ 
        tasks: responseData,
        timestamp: new Date().toISOString(),
        count: responseData.length
      });
      
      // Add cache-busting headers
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    } else if (type === 'all') {
      responseData = await getRecentReports(100); // Get more for admin dashboard
      const serializedReports = responseData.map(report => ({
        ...report,
        createdAt: report.createdAt?.toISOString()
      }));
      
      const response = NextResponse.json({ 
        reports: serializedReports,
        timestamp: new Date().toISOString(),
        count: serializedReports.length
      });
      
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received report data:', body);

    const { location, wasteType, amount, imageUrl, verificationResult } = body;
    
    // Handle location object and ensure proper format
    let locationString;
    if (typeof location === 'object') {
      // Handle both {lat, lng} and {latitude, longitude} formats
      const lat = location.lat || location.latitude;
      const lng = location.lng || location.longitude;
      
      if (typeof lat === 'number' && typeof lng === 'number') {
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          locationString = `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
        } else {
          console.error('Invalid coordinates:', { lat, lng });
        }
      }
    } else if (typeof location === 'string') {
      // Validate and format string input
      const [lat, lng] = location.split(',').map(coord => Number(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        locationString = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      }
    }

    // Validate required fields
    if (!locationString || !wasteType || !amount) {
      console.error('Missing required fields:', { location: locationString, wasteType, amount });
      return NextResponse.json({ 
        error: 'Missing required fields', 
        fields: { location: !!locationString, wasteType: !!wasteType, amount: !!amount } 
      }, { status: 422 });
    }

    // Get authenticated user
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('Creating report with data:', { 
      userId, 
      location: locationString, 
      wasteType, 
      amount,
      imageUrl,
      verificationResult
    });
    
    // Create report in the database
    const [report] = await db.insert(Reports)
      .values({
        userId,
        location: locationString,
        wasteType,
        amount,
        imageUrl,
        verificationResult: verificationResult ? JSON.stringify(verificationResult) : null,
        status: 'pending',
        createdAt: new Date()
      })
      .returning();

    if (!report) {
      throw new Error('Failed to create report');
    }

    console.log('Report created successfully:', report);

    // Award points for reporting waste
    const pointsEarned = 10;
    await db.insert(Transactions)
      .values({
        userId,
        type: 'earned_report',
        amount: pointsEarned,
        description: 'Points earned for reporting waste',
        date: new Date()
      });

    console.log('Transaction created successfully');

    // Create notification
    await db.insert(Notifications)
      .values({
        userId,
        message: `Thank you for reporting waste! You've earned ${pointsEarned} points.`,
        type: 'report_submitted',
        isRead: false,
        createdAt: new Date()
      });

    console.log('Notification created successfully');
    
    // Create response with cache-busting headers for real-time updates
    const response = NextResponse.json({ 
      report: {
        ...report,
        createdAt: report.createdAt.toISOString()
      },
      message: 'Report submitted successfully!',
      pointsEarned,
      timestamp: new Date().toISOString()
    }, { status: 201 });
    
    // Add cache-busting headers to ensure real-time updates
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create report' },
      { status: 500 }
    );
  }
}




