import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { HiMenu, HiX } from 'react-icons/hi'
import AuthModal from './AuthModal'

export default function Navbar({ user, profile, refreshProfile }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'

  // Display name: prefer full_name, fall back to first part of email
  const displayName = profile?.full_name
    || user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'Account'

  // First name only for nav (trim and take first word)
  const firstName = displayName.split(' ')[0]

  // Avatar initial
  const avatarLetter = firstName.charAt(0).toUpperCase()

  async function signOut() {
    await supabase.auth.signOut()
    toast.success('Signed out.')
    router.push('/')
  }

  function openAuth(mode) {
    setAuthMode(mode)
    setShowAuth(true)
  }

  const navLinks = [
    { href: '/',          label: 'Publications' },
    { href: '/about',     label: 'About' },
    { href: '/resources', label: 'Resources' },
    { href: '/submit',    label: 'Submit Article' },
  ]

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-brand-900 text-brand-200 text-center py-1.5 text-xs font-ui tracking-wide">
        ✞ &nbsp; Sharing God's Word — Silent Witness: Truth in every page.
      </div>

      <nav className="sticky top-0 z-50 glass border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative w-10 h-10">
              <Image src="/logo.png" alt="Logo" fill className="object-contain drop-shadow-md" />
            </div>
            <div>
              <div className="font-display text-brand-900 font-bold text-lg leading-none tracking-wide">Silent Witness</div>
              <div className="font-ui text-brand-500 text-xs tracking-widest uppercase">Truth in every page</div>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className={`px-4 py-2 rounded-lg font-ui text-sm font-medium transition-all ${
                  router.pathname === link.href
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-brand-700'
                }`}>
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin"
                className={`px-4 py-2 rounded-lg font-ui text-sm font-semibold transition-all ${
                  router.pathname === '/admin'
                    ? 'bg-brand-600 text-white'
                    : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                }`}>
                🛡 Admin
              </Link>
            )}
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* User chip */}
                <div className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-xl px-3 py-1.5">
                  <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold font-ui flex-shrink-0">
                    {avatarLetter}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="font-ui text-sm font-semibold text-brand-800 leading-none">
                      {firstName}
                    </span>
                    {profile?.role && profile.role !== 'member' && (
                      <span className="font-ui text-xs text-brand-500 leading-none mt-0.5 capitalize">
                        {profile.role}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={signOut}
                  className="px-3 py-1.5 text-sm font-ui font-medium text-slate-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => openAuth('login')}
                  className="px-4 py-2 font-ui text-sm font-medium text-brand-700 hover:bg-brand-50 rounded-lg transition-all">
                  Sign In
                </button>
                <button onClick={() => openAuth('register')}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-ui text-sm font-semibold rounded-lg transition-all shadow-sm">
                  Register
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-slate-600 rounded-lg hover:bg-slate-100" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <HiX size={22} /> : <HiMenu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-blue-100 bg-white px-4 py-3 space-y-1 shadow-lg">
            {user && (
              <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-brand-50 rounded-xl border border-brand-100">
                <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">
                  {avatarLetter}
                </div>
                <div>
                  <div className="font-ui font-semibold text-sm text-slate-800">{displayName}</div>
                  <div className="font-ui text-xs text-slate-500 capitalize">{profile?.role || 'member'}</div>
                </div>
              </div>
            )}
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg font-ui text-sm font-medium transition-all ${
                  router.pathname === link.href ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}>
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 rounded-lg font-ui text-sm font-semibold text-brand-700 bg-brand-50">
                🛡 Admin Panel
              </Link>
            )}
            <hr className="my-2 border-slate-100" />
            {user ? (
              <button onClick={signOut} className="w-full text-left px-4 py-2.5 font-ui text-sm text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors">
                Sign Out
              </button>
            ) : (
              <div className="flex gap-2 pt-1">
                <button onClick={() => { openAuth('login'); setMenuOpen(false) }}
                  className="flex-1 py-2.5 border border-brand-200 text-brand-700 rounded-xl font-ui text-sm font-semibold">
                  Sign In
                </button>
                <button onClick={() => { openAuth('register'); setMenuOpen(false) }}
                  className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-ui text-sm font-semibold">
                  Register
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {showAuth && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onSwitch={setAuthMode}
        />
      )}
    </>
  )
}
