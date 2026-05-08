import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ddqdfilyncsgedphdzok.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkcWRmaWx5bmNzZ2VkcGhkem9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1Njc4NTMsImV4cCI6MjA2MDE0Mzg1M30.vA3aSVTOuNJ3YlSEr9bDrpedQGKrRAT79VHoGnEj_Q8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

export function getYouTubeId(url) {
  const patterns = [
    /(?:v=|\/v\/|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]
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
