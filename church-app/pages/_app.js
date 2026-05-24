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
    // ── STEP 1: Restore the stored session.
    // getSession() reads from localStorage and is the reliable way to
    // rehydrate auth on page refresh in Next.js Pages Router.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setAuthReady(true) // no user — mark ready immediately
    })

    // ── STEP 2: Listen for future auth events.
    // We skip INITIAL_SESSION because Step 1 already handled it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return

      setUser(session?.user ?? null)

      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setAuthReady(true)
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
        if (error.code === 'PGRST116') {
          // Profile doesn't exist yet — auto-create it
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (authUser) {
            const { error: upsertErr } = await supabase.from('profiles').upsert({
              id:        authUser.id,
              email:     authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
              role:      'member',
            })
            if (!upsertErr) {
              const { data: newProfile } = await supabase
                .from('profiles').select('*').eq('id', id).single()
              setProfile(newProfile)
            }
          }
        }
        return
      }

      setProfile(data)
    } catch (e) {
      console.error('fetchProfile exception:', e)
    } finally {
      // Always mark auth as ready once we've attempted the profile fetch,
      // even if it failed — so pages don't hang forever on a network error.
      setAuthReady(true)
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
