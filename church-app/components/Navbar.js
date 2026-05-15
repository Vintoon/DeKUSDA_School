import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { HiMenu, HiX, HiUser, HiLogout, HiShieldCheck } from 'react-icons/hi'
import AuthModal from './AuthModal'

export default function Navbar({ user, profile, refreshProfile }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
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
  const avatarUrl = profile?.avatar_url || null

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  async function signOut() {
    setDropdownOpen(false)
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
        ✞ &nbsp; Sharing God's Word — In Light of the Word: Truth in every page.
      </div>

      <nav className="sticky top-0 z-50 glass border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative w-10 h-10">
              <Image src="/logo.png" alt="Logo" fill className="object-contain drop-shadow-md" />
            </div>
            <div>
              <div className="font-display text-brand-900 font-bold text-lg leading-none tracking-wide">In Light of the Word</div>
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
              <div className="relative" ref={dropdownRef}>
                {/* User chip / dropdown trigger */}
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-xl px-3 py-1.5 hover:bg-brand-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold font-ui flex-shrink-0 overflow-hidden">
                    {avatarUrl
                      ? <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
                      : avatarLetter
                    }
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
                  <svg className={`w-3 h-3 text-brand-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-[100] animate-fadeUp">
                    <Link href="/profile" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 transition-colors group">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {avatarUrl
                          ? <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
                          : <HiUser className="text-brand-600" size={14} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-ui text-sm font-semibold text-slate-800 truncate">{displayName}</div>
                        <div className="font-ui text-xs text-slate-400 truncate">{user.email}</div>
                      </div>
                    </Link>
                    <hr className="my-1 border-slate-100" />
                    <Link href="/profile" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 transition-colors font-ui text-sm text-slate-700">
                      <HiUser size={16} className="text-slate-400" /> My Profile
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 transition-colors font-ui text-sm text-slate-700">
                        <HiShieldCheck size={16} className="text-slate-400" /> Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-slate-100" />
                    <button onClick={signOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors font-ui text-sm text-red-600">
                      <HiLogout size={16} className="text-red-400" /> Sign Out
                    </button>
                  </div>
                )}
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
                <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
                    : avatarLetter
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-ui font-semibold text-sm text-slate-800 truncate">{displayName}</div>
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
            {user && (
              <Link href="/profile" onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg font-ui text-sm font-medium transition-all ${
                  router.pathname === '/profile' ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}>
                👤 My Profile
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
