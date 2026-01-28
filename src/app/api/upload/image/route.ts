import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin_session')?.value
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get('image') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'collections')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`
    const filePath = path.join(uploadsDir, fileName)

    // Write the file
    await writeFile(filePath, new Uint8Array(buffer))

    // Return the public URL
    const imageUrl = `/uploads/collections/${fileName}`

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      message: 'Image uploaded successfully' 
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ 
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
