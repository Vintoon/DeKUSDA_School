/**
 * /api/devotional
 *
 * GET  — fetch today's devotional (or latest)
 * POST — create a new devotional (admin only)
 */

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  if (req.method === 'GET') {
    const today = new Date().toISOString().split('T')[0]
    // Try today's first, else latest
    let { data } = await supabase
      .from('devotionals')
      .select('*')
      .eq('published_date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) {
      const { data: latest } = await supabase
        .from('devotionals')
        .select('*')
        .order('published_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      data = latest
    }

    return res.status(200).json({ devotional: data || null })
  }

  if (req.method === 'POST') {
    const authHeader = req.headers.authorization || ''
    const token      = authHeader.replace('Bearer ', '')

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role, full_name').eq('id', user.id).single()
    if (!['admin', 'superadmin'].includes(profile?.role)) {
      return res.status(403).json({ error: 'Admins only' })
    }

    const { title, verse, verse_reference, content, published_date } = req.body
    if (!title || !content) return res.status(400).json({ error: 'title and content required' })

    const { data: devotional, error: insertError } = await supabaseAdmin
      .from('devotionals')
      .insert({
        title,
        verse:            verse || null,
        verse_reference:  verse_reference || null,
        content,
        author_id:        user.id,
        author_name:      profile.full_name || user.email,
        published_date:   published_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (insertError) return res.status(500).json({ error: insertError.message })
    return res.status(201).json({ devotional })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
