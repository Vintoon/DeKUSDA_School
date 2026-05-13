/**
 * POST /api/notify-author
 *
 * Sends a notification email to a publication author when their submission
 * is approved or rejected by an admin.
 *
 * Required env vars (set in Vercel → Settings → Environment Variables):
 *   GMAIL_USER     — the full Gmail address,  e.g. dekusdaliterature@gmail.com
 *   GMAIL_APP_PASS — a Gmail App Password (16 chars, no spaces)
 *                    Generate at: https://myaccount.google.com/apppasswords
 *                    (Requires 2-Step Verification to be ON on the account)
 *
 * Body (JSON):
 *   { authorName, authorEmail, publicationTitle, status: 'approved'|'rejected' }
 */

import nodemailer from 'nodemailer'

// ─── Email templates ──────────────────────────────────────────────────────────

function approvedHtml(authorName, title) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Publication Approved</title>
</head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(37,99,235,0.10);max-width:96vw;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:36px 40px 28px;text-align:center;">
              <p style="margin:0 0 6px;font-size:28px;">✞</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                In Light of the Word
              </h1>
              <p style="margin:6px 0 0;color:#93c5fd;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
                Truth in every page
              </p>
            </td>
          </tr>

          <!-- Approved badge -->
          <tr>
            <td style="background:#ecfdf5;padding:18px 40px;text-align:center;border-bottom:1px solid #d1fae5;">
              <span style="display:inline-block;background:#10b981;color:#ffffff;font-size:13px;font-weight:700;padding:6px 20px;border-radius:99px;letter-spacing:0.5px;">
                ✓ &nbsp;PUBLICATION APPROVED
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#1e293b;">
                Dear <strong>${authorName}</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;">
                We are glad to inform you that our admins have reviewed your publication
                <strong style="color:#1e3a8a;">"${title}"</strong> and have approved of it.
              </p>
              <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;">
                Continue spreading the gospel through writing.
              </p>

              <!-- Divider with cross -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="border-top:1px solid #e2e8f0;"></td>
                  <td style="padding:0 14px;color:#94a3b8;font-size:18px;">✞</td>
                  <td style="border-top:1px solid #e2e8f0;"></td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:16px;color:#374151;">God Bless You.</p>
              <p style="margin:0 0 24px;font-size:16px;color:#1e3a8a;font-weight:700;font-style:italic;">
                Maranatha
              </p>

              <!-- Scripture callout -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 10px 10px 0;padding:14px 18px;">
                    <p style="margin:0;font-size:14px;color:#1e40af;font-style:italic;line-height:1.6;">
                      "Then I saw another angel flying in mid-air, and he had the eternal gospel
                      to proclaim to those who live on the earth."
                    </p>
                    <p style="margin:8px 0 0;font-size:12px;color:#3b82f6;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                      — Revelation 14:6
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8faff;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                This email was sent by the <strong>DeKUSDA In Light of the Word</strong> editorial team.<br/>
                Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

function approvedText(authorName, title) {
  return `Dear ${authorName},

We are glad to inform you that our admins have reviewed your publication "${title}" and have approved of it.

Continue spreading the gospel through writing.

God Bless You.
Maranatha

— DeKUSDA In Light of the Word Editorial Team
`
}

function rejectedHtml(authorName, title) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Publication Update</title>
</head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(37,99,235,0.10);max-width:96vw;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:36px 40px 28px;text-align:center;">
              <p style="margin:0 0 6px;font-size:28px;">✞</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                In Light of the Word
              </h1>
              <p style="margin:6px 0 0;color:#93c5fd;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
                Truth in every page
              </p>
            </td>
          </tr>

          <!-- Status badge -->
          <tr>
            <td style="background:#fff7ed;padding:18px 40px;text-align:center;border-bottom:1px solid #fed7aa;">
              <span style="display:inline-block;background:#f97316;color:#ffffff;font-size:13px;font-weight:700;padding:6px 20px;border-radius:99px;letter-spacing:0.5px;">
                ✗ &nbsp;PUBLICATION NOT APPROVED
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#1e293b;">
                Dear <strong>${authorName}</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;">
                Thank you for your submission
                <strong style="color:#1e3a8a;">"${title}"</strong>.
                After careful review, our admins found it unsuitable for publication at this time.
              </p>
              <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;">
                We encourage you to continue writing for the glory of God. You are welcome to
                revise and resubmit, or send a different piece for consideration.
              </p>

              <!-- Divider with cross -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="border-top:1px solid #e2e8f0;"></td>
                  <td style="padding:0 14px;color:#94a3b8;font-size:18px;">✞</td>
                  <td style="border-top:1px solid #e2e8f0;"></td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:16px;color:#374151;">God Bless You.</p>
              <p style="margin:0 0 24px;font-size:16px;color:#1e3a8a;font-weight:700;font-style:italic;">
                Maranatha
              </p>

              <!-- Scripture callout -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 10px 10px 0;padding:14px 18px;">
                    <p style="margin:0;font-size:14px;color:#1e40af;font-style:italic;line-height:1.6;">
                      "Let us not grow weary of doing good, for in due season we will reap,
                      if we do not give up."
                    </p>
                    <p style="margin:8px 0 0;font-size:12px;color:#3b82f6;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                      — Galatians 6:9
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8faff;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                This email was sent by the <strong>DeKUSDA In Light of the Word</strong> editorial team.<br/>
                Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

function rejectedText(authorName, title) {
  return `Dear ${authorName},

Thank you for your submission "${title}". After careful review, our admins found it unsuitable for publication at this time.

We encourage you to continue writing for the glory of God. You are welcome to revise and resubmit, or send a different piece for consideration.

God Bless You.
Maranatha

— DeKUSDA In Light of the Word Editorial Team
`
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { authorName, authorEmail, publicationTitle, status } = req.body

  // Basic validation
  if (!authorEmail || !publicationTitle || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Missing or invalid fields' })
  }

  // Check env vars are set
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASS

  if (!gmailUser || !gmailPass) {
    console.error('notify-author: GMAIL_USER or GMAIL_APP_PASS env vars not set')
    // Don't fail the whole review — just log and return a warning
    return res.status(200).json({
      sent: false,
      warning: 'Email env vars not configured. Set GMAIL_USER and GMAIL_APP_PASS in Vercel.',
    })
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  })

  const name  = authorName || 'Author'
  const title = publicationTitle

  const mailOptions = {
    from: `"In Light of the Word — DeKUSDA" <${gmailUser}>`,
    to:   authorEmail,
    subject: status === 'approved'
      ? `✓ Your publication "${title}" has been approved`
      : `Update on your publication "${title}"`,
    text: status === 'approved'
      ? approvedText(name, title)
      : rejectedText(name, title),
    html: status === 'approved'
      ? approvedHtml(name, title)
      : rejectedHtml(name, title),
  }

  try {
    await transporter.sendMail(mailOptions)
    return res.status(200).json({ sent: true })
  } catch (err) {
    console.error('notify-author send error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
