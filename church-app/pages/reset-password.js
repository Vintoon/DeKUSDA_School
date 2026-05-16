import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { HiEye, HiEyeOff } from 'react-icons/hi'
import Navbar from '../components/Navbar'

export default function ResetPassword({ user, profile }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase sets the session from the URL hash automatically.
    // Store and clean up the subscription to avoid memory leaks.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleReset(e) {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Password updated! Redirecting…')
    setTimeout(() => router.push('/'), 2000)
  }

  return (
    <>
      <Head><title>Reset Password — In Light of the Word: Truth in every page</title></Head>
      <Navbar user={user} profile={profile} />
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 w-full max-w-md overflow-hidden">
          <div className="hero-pattern px-8 py-8 text-center">
            <img src="/logo.png" alt="Logo" className="h-14 w-auto mx-auto mb-4 drop-shadow" />
            <h2 className="font-display text-2xl font-bold text-white">Set New Password</h2>
            <p className="text-blue-200 font-ui text-sm mt-1">Choose a strong password for your account</p>
          </div>
          {!ready ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="font-ui text-slate-500 text-sm">Verifying reset link…</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="p-8 space-y-4">
              <div>
                <label className="block font-ui text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pr-11 font-ui text-sm" placeholder="Min 8 characters" required />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600">
                    {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-ui text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 font-ui text-sm" placeholder="Repeat password" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-ui font-semibold rounded-lg transition-all disabled:opacity-60">
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
