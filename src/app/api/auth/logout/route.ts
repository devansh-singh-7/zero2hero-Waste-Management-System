import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('auth_token', '', { path: '/', maxAge: 0 })
  return res
}




