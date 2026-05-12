import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || 'https://ddqdfilyncsgedphdzok.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkcWRmaWx5bmNzZ2VkcGhkem9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1Njc4NTMsImV4cCI6MjA2MDE0Mzg1M30.vA3aSVTOuNJ3YlSEr9bDrpedQGKrRAT79VHoGnEj_Q8'

// Use a module-level singleton so the same client instance is reused
// across every import — critical for Supabase auth to work correctly.
// A new createClient() call = a fresh auth state with no stored session.
let _client = null

function getClient() {
  if (_client) return _client
  _client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: true,
      // Explicitly use localStorage so the session survives page refreshes.
      // We only do this in the browser — on the server we use in-memory (default).
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })
  return _client
}

export const supabase = getClient()

export function getYouTubeId(url) {
  const patterns = [/(?:v=|\/v\/|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/]
  for (const pattern of patterns) {
    const match = url?.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function getYouTubeThumbnail(url) {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}
