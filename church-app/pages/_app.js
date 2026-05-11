import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
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
    // Use onAuthStateChange ONLY (not getSession + onAuthStateChange together).
    // In Supabase v2 this fires an INITIAL_SESSION event on mount, giving us the
    // current session without a separate getSession() call.
    // Doing both caused a race condition on mobile: getSession() would call
    // fetchProfile before the token was hydrated from storage, triggering 401s.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
      // Mark auth as fully initialised after the first event fires.
      setAuthReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(id) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    setProfile(data)
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
