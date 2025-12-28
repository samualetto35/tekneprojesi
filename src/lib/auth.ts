import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Get authenticated user (server-side)
export async function getAuthUser() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  const refreshToken = cookieStore.get('sb-refresh-token')?.value

  if (!accessToken || !refreshToken) {
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: { session }, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error || !session) {
    return null
  }

  return session.user
}

// Require authentication (redirects to login if not authenticated)
export async function requireAuth() {
  const user = await getAuthUser()
  
  if (!user) {
    redirect('/admin/login')
  }
  
  return user
}

// Check if user is admin (you can customize this logic)
export async function isAdmin() {
  const user = await getAuthUser()
  
  if (!user) {
    return false
  }
  
  // For now, we'll allow any authenticated user
  // You can add role-based checks here later
  // For example: check user metadata or a separate admin_users table
  return true
}

