import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      const cookieStore = await cookies()
      cookieStore.set('sb-access-token', data.session.access_token, {
        path: '/',
        maxAge: 3600,
        httpOnly: true,
        sameSite: 'lax',
      })
      cookieStore.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        maxAge: 604800,
        httpOnly: true,
        sameSite: 'lax',
      })
      
      return NextResponse.redirect(new URL('/admin', requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/admin/login', requestUrl.origin))
}

