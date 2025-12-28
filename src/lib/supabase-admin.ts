import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Server-side Supabase client for admin operations
export async function createServerClient() {
  const cookieStore = await cookies()
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        getSession: async () => {
          const accessToken = cookieStore.get('sb-access-token')?.value
          const refreshToken = cookieStore.get('sb-refresh-token')?.value
          
          if (!accessToken || !refreshToken) {
            return { data: { session: null }, error: null }
          }
          
          // Create a client to refresh the session
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          
          return { data, error }
        },
      },
    }
  )
}

// Client-side Supabase client with auth
export function createClientClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

