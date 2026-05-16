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
    // ── STEP 1: Read the stored session directly from localStorage.
    //
    // getSession() is the only fully-reliable way to restore a session on
    // page refresh in Next.js Pages Router.  It reads synchronously from
    // localStorage and resolves via Promise — it does NOT depend on the
    // timing of event emitters.
    //
    // onAuthStateChange's INITIAL_SESSION event fires asynchronously and
    // can arrive BEFORE the listener is registered in some environments
    // (React Strict Mode double-mount, hot-module replacement, etc.),
    // silently leaving the user in a "logged-out" state on every refresh.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setAuthReady(true)
    })

    // ── STEP 2: Listen for all future auth state changes.
    //
    // We skip INITIAL_SESSION because Step 1 already handled the initial
    // state.  All other events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED,
    // PASSWORD_RECOVERY, USER_UPDATED) are handled here.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return

      setUser(session?.user ?? null)

      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
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
        refreshProfile={() => user && fetchProfile(user.id)}
      />
    </>
  )
}
