import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { HiX, HiEye, HiEyeOff, HiMail } from 'react-icons/hi'

// Google "G" SVG icon (official brand colours)
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function AuthModal({ mode, onClose, onSwitch }) {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) throw error
      // Browser will redirect — no need to close modal
    } catch (err) {
      toast.error(err.message)
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Welcome back! 🙏')
        onClose()
      } else {
        if (!name.trim()) { toast.error('Please enter your name'); setLoading(false); return }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } }
        })
        if (error) throw error
        toast.success('Account created! Check your email to verify. 🙏')
        onClose()
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (!email.trim()) { toast.error('Please enter your email first'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setResetSent(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md modal-enter overflow-hidden">
        {/* Header */}
        <div className="hero-pattern px-8 pt-8 pb-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-blue-200 hover:text-white transition-colors">
            <HiX size={20} />
          </button>
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto drop-shadow-lg" />
          </div>
          <h2 className="font-display text-2xl font-bold text-center">
            {forgotMode ? 'Reset Password' : mode === 'login' ? 'Welcome Back' : 'Join the Community'}
          </h2>
          <p className="text-blue-200 text-center font-ui text-sm mt-1">
            {forgotMode ? 'Enter your email to receive a reset link'
              : mode === 'login' ? 'Sign in to your account'
              : 'Create your free account'}
          </p>
        </div>

        {/* Reset email sent confirmation */}
        {resetSent ? (
          <div className="px-8 py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiMail className="text-green-600" size={28} />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Check Your Email</h3>
            <p className="font-ui text-sm text-slate-500 mb-6">
              We sent a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.
            </p>
            <button onClick={() => { setForgotMode(false); setResetSent(false) }}
              className="font-ui text-sm text-brand-600 font-semibold hover:underline">
              ← Back to Sign In
            </button>
          </div>

        ) : forgotMode ? (
          /* Forgot password form */
          <form onSubmit={handleForgotPassword} className="px-8 py-6 space-y-4">
            <div>
              <label className="block font-ui text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 font-ui text-sm"
                placeholder="your@email.com" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-ui font-semibold rounded-lg transition-all disabled:opacity-60">
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <p className="text-center font-ui text-sm text-slate-500">
              <button type="button" onClick={() => setForgotMode(false)}
                className="text-brand-600 font-semibold hover:underline">
                ← Back to Sign In
              </button>
            </p>
          </form>

        ) : (
          /* Login / Register form */
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block font-ui text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 font-ui text-sm"
                  placeholder="Your full name" required />
              </div>
            )}
            <div>
              <label className="block font-ui text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 font-ui text-sm"
                placeholder="your@email.com" required />
            </div>
            <div>
              <label className="block font-ui text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pr-11 font-ui text-sm"
                  placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 transition-colors">
                  {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex justify-end -mt-1">
                <button type="button" onClick={() => setForgotMode(true)}
                  className="font-ui text-xs text-brand-600 hover:underline font-medium">
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-ui font-semibold rounded-lg transition-all shadow-sm disabled:opacity-60 mt-2">
              {loading ? '…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="font-ui text-xs text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 border border-slate-200 rounded-lg font-ui text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm disabled:opacity-60"
            >
              <GoogleIcon />
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <p className="text-center font-ui text-sm text-slate-500">
              {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
              <button type="button" onClick={() => onSwitch(mode === 'login' ? 'register' : 'login')}
                className="text-brand-600 font-semibold hover:underline">
                {mode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
