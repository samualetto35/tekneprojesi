import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token } = await request.json()
    
    const cookieStore = await cookies()
    cookieStore.set('sb-access-token', access_token, {
      path: '/',
      maxAge: 3600,
      httpOnly: true,
      sameSite: 'lax',
    })
    cookieStore.set('sb-refresh-token', refresh_token, {
      path: '/',
      maxAge: 604800,
      httpOnly: true,
      sameSite: 'lax',
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to set session' }, { status: 500 })
  }
}

