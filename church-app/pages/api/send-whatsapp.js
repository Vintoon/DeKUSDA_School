/**
 * POST /api/send-whatsapp
 *
 * Broadcasts an announcement to all subscribed WhatsApp numbers using the
 * Meta WhatsApp Cloud API (free tier — no Twilio needed).
 *
 * Required env vars (Vercel → Settings → Environment Variables):
 *   WHATSAPP_PHONE_NUMBER_ID  — from Meta Business → WhatsApp → API Setup
 *   WHATSAPP_ACCESS_TOKEN     — permanent token from Meta System User
 *   WHATSAPP_TEMPLATE_NAME    — template approved in Meta, e.g. "church_announcement"
 *   NEXT_PUBLIC_SITE_URL      — https://dekusdaschool.vercel.app
 *
 * Body (JSON):
 *   { title, message, link }      — announcement details
 *
 * ── How to set up (one-time) ──────────────────────────────────────────────────
 * 1. Go to https://developers.facebook.com → create app → WhatsApp Business
 * 2. Add test numbers under "To" in the API Setup
 * 3. Create a message template in the Meta Business Manager
 * 4. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in Vercel
 *
 * Recipients must opt in by messaging the WhatsApp business number first,
 * or by being added as test numbers in the developer console.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js'

const PHONE_ID    = process.env.WHATSAPP_PHONE_NUMBER_ID
const TOKEN       = process.env.WHATSAPP_ACCESS_TOKEN
const TEMPLATE    = process.env.WHATSAPP_TEMPLATE_NAME || 'church_announcement'
const SITE        = process.env.NEXT_PUBLIC_SITE_URL || 'https://dekusdaschool.vercel.app'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Verify caller is an admin via Supabase service role
  const authHeader = req.headers.authorization || ''
  const token      = authHeader.replace('Bearer ', '')

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'superadmin'].includes(profile?.role)) {
    return res.status(403).json({ error: 'Admins only' })
  }

  const { title, message, link } = req.body
  if (!title || !message) return res.status(400).json({ error: 'title and message are required' })

  if (!PHONE_ID || !TOKEN) {
    return res.status(503).json({
      error: 'WhatsApp not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in Vercel.',
    })
  }

  // Fetch all subscribed phone numbers from whatsapp_subscribers table
  const { data: subscribers } = await supabaseAdmin
    .from('whatsapp_subscribers')
    .select('phone')
    .eq('active', true)

  if (!subscribers?.length) {
    return res.status(200).json({ sent: 0, message: 'No active WhatsApp subscribers' })
  }

  const results = { sent: 0, failed: 0, errors: [] }

  for (const sub of subscribers) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: sub.phone,
        type: 'template',
        template: {
          name: TEMPLATE,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: title },
                { type: 'text', text: message.substring(0, 200) },
                { type: 'text', text: link || SITE },
              ],
            },
          ],
        },
      }

      const r = await fetch(
        `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      )

      const json = await r.json()
      if (r.ok) {
        results.sent++
      } else {
        results.failed++
        results.errors.push({ phone: sub.phone, error: json.error?.message })
      }
    } catch (err) {
      results.failed++
      results.errors.push({ phone: sub.phone, error: err.message })
    }
  }

  // Log the broadcast in DB
  await supabaseAdmin.from('whatsapp_broadcasts').insert({
    title,
    message,
    link: link || null,
    sent_count: results.sent,
    failed_count: results.failed,
    sent_by: user.id,
  })

  return res.status(200).json(results)
}
