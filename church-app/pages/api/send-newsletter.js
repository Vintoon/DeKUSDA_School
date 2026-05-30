/**
 * POST /api/send-newsletter
 *
 * Emails all registered members + newsletter subscribers when a new
 * publication is approved or an announcement is posted by an admin.
 *
 * Uses the same Nodemailer / Gmail SMTP config as notify-author.js.
 *
 * Required env vars:
 *   GMAIL_USER      — full Gmail address
 *   GMAIL_APP_PASS  — 16-char App Password (Settings → Security → App Passwords)
 *   NEXT_PUBLIC_SITE_URL — https://dekusdaschool.vercel.app
 *
 * Body (JSON):
 *   {
 *     type: 'publication' | 'announcement' | 'devotional',
 *     title,
 *     summary,           // optional
 *     link,              // full URL to the content
 *     authorName,        // optional
 *   }
 */

import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://dekusdaschool.vercel.app'

function buildEmailHtml({ type, title, summary, link, authorName }) {
  const labelMap = {
    publication: { badge: '#2563eb', text: 'NEW PUBLICATION' },
    announcement: { badge: '#7c3aed', text: 'ANNOUNCEMENT' },
    devotional:  { badge: '#059669', text: "TODAY'S DEVOTIONAL" },
  }
  const { badge, text } = labelMap[type] || labelMap.publication

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(37,99,235,.10);max-width:96vw;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:36px 40px 28px;text-align:center;">
          <p style="margin:0 0 6px;font-size:28px;">✞</p>
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:.5px;">In Light of the Word</h1>
          <p style="margin:6px 0 0;color:#93c5fd;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Truth in every page</p>
        </td></tr>

        <!-- Badge -->
        <tr><td style="background:#f0f4ff;padding:14px 40px;text-align:center;border-bottom:1px solid #e0e8ff;">
          <span style="display:inline-block;background:${badge};color:#fff;font-size:12px;font-weight:700;padding:5px 18px;border-radius:99px;letter-spacing:1px;">
            ${text}
          </span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1e293b;line-height:1.3;">${title}</h2>
          ${authorName ? `<p style="margin:0 0 16px;font-size:13px;color:#64748b;">By ${authorName}</p>` : ''}
          ${summary ? `<p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.6;font-style:italic;">${summary}</p>` : ''}
          <a href="${link}"
            style="display:inline-block;background:#1e3a8a;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;letter-spacing:.3px;">
            Read Now →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8faff;padding:20px 40px;text-align:center;border-top:1px solid #e0e8ff;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            You are receiving this because you are a member of In Light of the Word.
            <br/>
            <a href="${SITE}" style="color:#2563eb;text-decoration:none;">Visit the site</a>
            &nbsp;·&nbsp;
            <a href="${SITE}/unsubscribe?email={{EMAIL}}" style="color:#94a3b8;text-decoration:none;">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Auth check — must be admin
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

  const { type, title, summary, link, authorName } = req.body
  if (!title || !link) return res.status(400).json({ error: 'title and link are required' })

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
    return res.status(503).json({ error: 'Email not configured — set GMAIL_USER and GMAIL_APP_PASS in Vercel.' })
  }

  // Collect all recipient emails: registered members + newsletter subscribers
  const [{ data: members }, { data: subscribers }] = await Promise.all([
    supabaseAdmin.from('profiles')
      .select('email')
      .not('email', 'is', null)
      .neq('newsletter_opt_out', true),   // respect unsubscribes
    supabaseAdmin.from('newsletter_subscribers').select('email').eq('active', true),
  ])

  const allEmails = [
    ...(members || []).map(m => m.email),
    ...(subscribers || []).map(s => s.email),
  ].filter(Boolean)

  // De-duplicate
  const uniqueEmails = [...new Set(allEmails)]

  if (!uniqueEmails.length) return res.status(200).json({ sent: 0, message: 'No subscribers' })

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASS },
  })

  const html = buildEmailHtml({ type: type || 'publication', title, summary, link, authorName })

  const subjectMap = {
    publication: `📖 New Publication: ${title}`,
    announcement: `📢 Announcement: ${title}`,
    devotional: `🙏 Today's Devotional: ${title}`,
  }
  const subject = subjectMap[type] || subjectMap.publication

  let sent = 0, failed = 0

  // Send individually so each gets their own unsubscribe link
  // (batches of 50 via BCC would share one link — not ideal for GDPR)
  const BATCH = 50
  for (let i = 0; i < uniqueEmails.length; i += BATCH) {
    const batch = uniqueEmails.slice(i, i + BATCH)
    try {
      // Send as individual emails so the unsubscribe link is personalised
      await Promise.all(batch.map(async (email) => {
        const personalHtml = html.replace('{{EMAIL}}', encodeURIComponent(email))
        await transporter.sendMail({
          from: `"In Light of the Word" <${process.env.GMAIL_USER}>`,
          to: email,
          subject,
          html: personalHtml,
        })
      }))
      sent += batch.length
    } catch (err) {
      console.error('Newsletter batch error:', err.message)
      failed += batch.length
    }
  }

  return res.status(200).json({ sent, failed, total: uniqueEmails.length })
}
