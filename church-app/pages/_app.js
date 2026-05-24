import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function App({ Component, pageProps }) {
  const [user, setUser]               = useState(null)
  const [profile, setProfile]         = useState(null)
  const [authReady, setAuthReady]     = useState(false)
  // profileReady tracks whether we've finished the profile fetch for the
  // current user (or confirmed there is no user).  Pages that need the role
  // (e.g. Admin) must wait for this before deciding access.
  const [profileReady, setProfileReady] = useState(false)

  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {})
      })
    }
  }, [])

  useEffect(() => {
    // ── STEP 1: Restore the stored session, then fetch the profile.
    // We only set authReady AFTER the profile fetch completes so that
    // pages never render with user!=null but profile==null (the race
    // condition that caused admins to appear as guests on mobile).
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)  // await — profile loads first
      }
      setAuthReady(true)
      setProfileReady(true)
    })

    // ── STEP 2: Listen for future auth events (sign-in, sign-out, token refresh…)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return

      setUser(session?.user ?? null)
      setProfileReady(false)  // reset while we re-fetch

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setProfileReady(true)
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Profile doesn't exist yet — auto-create it so the user isn't stuck
        if (error.code === 'PGRST116') {
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (authUser) {
            const { error: upsertErr } = await supabase.from('profiles').upsert({
              id:        authUser.id,
              email:     authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
              role:      'member',
            })
            if (upsertErr) {
              console.error('Auto-create profile failed:', upsertErr)
              return
            }
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
        profileReady={profileReady}
        refreshProfile={() => user && fetchProfile(user.id)}
      />
    </>
  )
}
