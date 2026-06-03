/**
 * /unsubscribe
 * Lets anyone opt out of the newsletter via a link in the email footer.
 * URL format: /unsubscribe?email=user@example.com
 */

import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function UnsubscribePage() {
  const router   = useRouter()
  const email    = router.query.email || ''
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [msg, setMsg]       = useState('')

  async function handleUnsubscribe() {
    if (!email) { setStatus('error'); setMsg('No email address found in the link.'); return }
    setStatus('loading')
    // Mark as inactive in newsletter_subscribers if they opted in via that table
    const { error: e1 } = await supabase
      .from('newsletter_subscribers')
      .update({ active: false })
      .eq('email', email)
    // Also check profiles table — we respect unsubscribes there too
    // by storing a preference column (add if it doesn't exist)
    const { error: e2 } = await supabase
      .from('profiles')
      .update({ newsletter_opt_out: true })
      .eq('email', email)

    if (e1 && e2) {
      setStatus('error')
      setMsg('Something went wrong. Please reply to any of our emails to unsubscribe manually.')
      return
    }
    setStatus('done')
  }

  return (
    <>
      <Head>
        <title>Unsubscribe — In Light of the Word</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen hero-pattern flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h1 className="font-display text-2xl font-bold text-slate-800 mb-2">
            {status === 'done' ? "You've been unsubscribed" : 'Unsubscribe from emails'}
          </h1>

          {status === 'idle' && (
            <>
              <p className="font-ui text-slate-500 text-sm mb-2">
                You'll no longer receive newsletter emails from
              </p>
              <p className="font-ui font-semibold text-brand-700 text-sm mb-6 break-all">{email || '(unknown email)'}</p>
              <button
                onClick={handleUnsubscribe}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-ui font-semibold transition-all"
              >
                Confirm Unsubscribe
              </button>
            </>
          )}

          {status === 'loading' && (
            <p className="font-ui text-slate-400 text-sm mt-4">Processing…</p>
          )}

          {status === 'done' && (
            <>
              <p className="font-ui text-slate-500 text-sm mb-6">
                We've removed <strong className="text-brand-700">{email}</strong> from our mailing list.
                You can always re-subscribe by creating an account on the site.
              </p>
              <Link href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-ui text-sm font-semibold transition-all">
                ← Back to In Light of the Word
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="font-ui text-red-500 text-sm mb-6">{msg}</p>
              <Link href="/" className="font-ui text-sm text-brand-600 hover:underline">← Go home</Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
