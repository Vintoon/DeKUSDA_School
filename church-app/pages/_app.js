import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function App({ Component, pageProps }) {
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {})
      })
    }
  }, [])

  useEffect(() => {
    // ── Step 1: Read the stored session immediately from localStorage.
    // onAuthStateChange alone can miss INITIAL_SESSION in Next.js pages router
    // because the event fires during createClient() — before useEffect runs.
    // getSession() explicitly reads the token so a refresh never loses the user.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      }
      // Mark auth as ready after the initial read, whether logged in or not
      setAuthReady(true)
    })

    // ── Step 2: Listen for auth changes (sign in, sign out, token refresh).
    // We skip INITIAL_SESSION here because Step 1 already handled it,
    // preventing a double fetchProfile call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return // handled by getSession() above
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(id) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      if (error) {
        console.error('fetchProfile error:', error)
        // If no profile exists yet, create one so the user isn't stuck
        if (error.code === 'PGRST116') {
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (authUser) {
            await supabase.from('profiles').upsert({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
              role: 'member',
            })
            // Retry fetch after creating profile
            const { data: newProfile } = await supabase
              .from('profiles').select('*').eq('id', id).single()
            setProfile(newProfile)
          }
        }
        return
      }
      setProfile(data)
    } catch (e) {
      console.error('fetchProfile exception:', e)
    }
  }

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' },
          success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
        }}
      />
      <Component
        {...pageProps}
        user={user}
        profile={profile}
        authReady={authReady}
        refreshProfile={() => user && fetchProfile(user.id)}
      />
    </>
  )
}
