import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import {
  HiPencil, HiCheck, HiX, HiCamera, HiDocumentText,
  HiClock, HiCheckCircle, HiXCircle, HiBan, HiEye,
  HiUser, HiMail, HiCalendar, HiTrash,
} from 'react-icons/hi'

const STATUS_CONFIG = {
  approved: { label: 'Approved', icon: HiCheckCircle, cls: 'bg-green-100 text-green-700 border-green-200' },
  pending:  { label: 'Pending',  icon: HiClock,       cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  rejected: { label: 'Rejected', icon: HiXCircle,     cls: 'bg-red-100 text-red-700 border-red-200' },
  draft:    { label: 'Draft',    icon: HiBan,          cls: 'bg-slate-100 text-slate-500 border-slate-200' },
}

const CAT_COLORS = {
  sermon:     'bg-blue-100 text-blue-700',
  devotional: 'bg-purple-100 text-purple-700',
  devotion:   'bg-purple-100 text-purple-700',
  testimony:  'bg-green-100 text-green-700',
  study:      'bg-amber-100 text-amber-700',
  news:       'bg-rose-100 text-rose-700',
  review:     'bg-indigo-100 text-indigo-700',
  Health:     'bg-teal-100 text-teal-700',
  general:    'bg-slate-100 text-slate-600',
}

export default function ProfilePage({ user, profile, authReady, refreshProfile }) {
  const router = useRouter()

  // profile fields
  const [fullName, setFullName]   = useState('')
  const [bio, setBio]             = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)

  // UI state
  const [editingName, setEditingName]   = useState(false)
  const [editingBio, setEditingBio]     = useState(false)
  const [savingName, setSavingName]     = useState(false)
  const [savingBio, setSavingBio]       = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // publications
  const [publications, setPublications] = useState([])
  const [pubsLoading, setPubsLoading]   = useState(false)
  const [pubFilter, setPubFilter]       = useState('all')

  const avatarInputRef = useRef(null)

  // Redirect if not logged in once auth is ready
  useEffect(() => {
    if (authReady && !user) {
      router.replace('/')
    }
  }, [authReady, user, router])

  // Sync profile data into local state
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setBio(profile.bio || '')
      setAvatarUrl(profile.avatar_url || null)
    }
  }, [profile])

  // Fetch user publications
  useEffect(() => {
    if (user?.id) fetchPublications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function fetchPublications() {
    setPubsLoading(true)
    try {
      const { data, error } = await supabase
        .from('publications')
        .select('id, title, summary, category, status, cover_image_url, created_at, like_count, comment_count, views')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setPublications(data || [])
    } catch (e) {
      toast.error('Could not load your publications.')
    } finally {
      setPubsLoading(false)
    }
  }

  async function saveName() {
    if (!fullName.trim()) { toast.error('Name cannot be empty'); return }
    setSavingName(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id)
      if (error) throw error
      toast.success('Name updated!')
      setEditingName(false)
      refreshProfile?.()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSavingName(false)
    }
  }

  async function saveBio() {
    setSavingBio(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio: bio.trim() })
        .eq('id', user.id)
      if (error) throw error
      toast.success('Bio updated!')
      setEditingBio(false)
      refreshProfile?.()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSavingBio(false)
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return }

    setUploadingAvatar(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`

      // Remove old avatar first (ignore error if it doesn't exist)
      await supabase.storage.from('avatars').remove([path])

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      // Add cache-bust so the browser reloads the new image
      const urlWithBust = `${publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithBust })
        .eq('id', user.id)
      if (updateError) throw updateError

      setAvatarUrl(urlWithBust)
      toast.success('Profile picture updated!')
      refreshProfile?.()
    } catch (e) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setUploadingAvatar(false)
      // Reset the input so the same file can be selected again
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  async function removeAvatar() {
    if (!avatarUrl) return
    setUploadingAvatar(true)
    try {
      // Try to delete the file from storage (best-effort)
      const path = avatarUrl.split('/avatars/')[1]?.split('?')[0]
      if (path) await supabase.storage.from('avatars').remove([path])

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id)
      if (error) throw error

      setAvatarUrl(null)
      toast.success('Profile picture removed.')
      refreshProfile?.()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Loading skeleton while auth resolves
  if (!authReady || !profile) {
    return (
      <div className="w-full overflow-x-hidden">
        <Head><title>My Profile – Silent Witness</title></Head>
        <Navbar user={user} profile={profile} refreshProfile={refreshProfile} />
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
          <div className="skeleton h-32 w-32 rounded-full mx-auto" />
          <div className="skeleton h-8 w-64 mx-auto" />
          <div className="skeleton h-4 w-96 mx-auto" />
        </div>
      </div>
    )
  }

  const displayName = fullName || user?.email?.split('@')[0] || 'Member'
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null

  const filteredPubs = pubFilter === 'all'
    ? publications
    : publications.filter(p => p.status === pubFilter)

  const stats = {
    total:    publications.length,
    approved: publications.filter(p => p.status === 'approved').length,
    pending:  publications.filter(p => p.status === 'pending').length,
  }

  return (
    <div className="w-full overflow-x-hidden bg-slate-50 min-h-screen">
      <Head>
        <title>My Profile – Silent Witness</title>
        <meta name="description" content="Manage your Silent Witness profile and publications." />
        <link rel="icon" href="/logo.png" />
      </Head>

      <Navbar user={user} profile={profile} refreshProfile={refreshProfile} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ── Profile Card ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
          {/* Header banner */}
          <div className="hero-pattern h-28 relative" />

          <div className="px-6 sm:px-8 pb-8">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14 mb-6">
              <div className="relative self-start">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-brand-600 flex items-center justify-center">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="font-display text-3xl font-bold text-white select-none">
                      {initials}
                    </span>
                  )}
                </div>

                {/* Avatar upload overlay */}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-brand-600 hover:bg-brand-700 rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-60"
                  title="Change profile picture"
                >
                  {uploadingAvatar
                    ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <HiCamera className="text-white" size={14} />
                  }
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Avatar actions */}
              {avatarUrl && (
                <button
                  onClick={removeAvatar}
                  disabled={uploadingAvatar}
                  className="flex items-center gap-1.5 text-xs font-ui font-medium text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 sm:mt-0 mt-1"
                >
                  <HiTrash size={13} /> Remove photo
                </button>
              )}
            </div>

            {/* Name */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-0.5">
                {editingName ? (
                  <div className="flex items-center gap-2 w-full max-w-sm">
                    <input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                      className="flex-1 border border-brand-300 rounded-lg px-3 py-1.5 font-display text-xl font-bold text-slate-900 focus:outline-none focus:border-brand-500"
                      autoFocus
                    />
                    <button onClick={saveName} disabled={savingName}
                      className="p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-60">
                      {savingName ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin block" /> : <HiCheck size={16} />}
                    </button>
                    <button onClick={() => { setEditingName(false); setFullName(profile?.full_name || '') }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                      <HiX size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900">{displayName}</h1>
                    <button
                      onClick={() => setEditingName(true)}
                      className="p-1.5 text-slate-300 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit name"
                    >
                      <HiPencil size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Role badge */}
              {profile?.role && profile.role !== 'member' && (
                <span className={`inline-flex items-center text-xs font-ui font-bold px-2.5 py-0.5 rounded-full border capitalize mt-1 ${
                  profile.role === 'superadmin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                }`}>
                  {profile.role}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-xs font-ui text-slate-400 mb-5">
              <span className="flex items-center gap-1.5"><HiMail size={13} /> {user?.email}</span>
              {joinDate && <span className="flex items-center gap-1.5"><HiCalendar size={13} /> Joined {joinDate}</span>}
              <span className="flex items-center gap-1.5"><HiDocumentText size={13} /> {stats.total} publication{stats.total !== 1 ? 's' : ''}</span>
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-ui text-xs font-bold text-slate-500 uppercase tracking-widest">About</span>
                {!editingBio && (
                  <button onClick={() => setEditingBio(true)}
                    className="flex items-center gap-1 text-xs font-ui font-medium text-slate-400 hover:text-brand-600 transition-colors">
                    <HiPencil size={12} /> Edit
                  </button>
                )}
              </div>
              {editingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    maxLength={280}
                    placeholder="Tell the community a little about yourself…"
                    className="w-full border border-brand-300 rounded-xl px-4 py-3 font-body text-sm text-slate-700 resize-none focus:outline-none focus:border-brand-500"
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-ui text-xs text-slate-400">{bio.length}/280</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingBio(false); setBio(profile?.bio || '') }}
                        className="px-3 py-1.5 font-ui text-xs font-medium text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                        Cancel
                      </button>
                      <button onClick={saveBio} disabled={savingBio}
                        className="px-4 py-1.5 bg-brand-600 text-white font-ui text-xs font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-60 flex items-center gap-1.5">
                        {savingBio && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="font-body text-sm text-slate-600 leading-relaxed">
                  {bio || <span className="italic text-slate-400">No bio yet — click Edit to add one.</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[
            { label: 'Total',    val: stats.total,    color: 'text-slate-700',  bg: 'bg-white' },
            { label: 'Live',     val: stats.approved, color: 'text-green-600',  bg: 'bg-white' },
            { label: 'Pending',  val: stats.pending,  color: 'text-amber-600',  bg: 'bg-white' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-100 shadow-sm p-4 text-center`}>
              <div className={`font-display text-3xl font-black ${s.color}`}>{s.val}</div>
              <div className="font-ui text-xs text-slate-400 uppercase tracking-wide mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── My Publications ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <HiDocumentText className="text-brand-500" size={20} />
              My Publications
            </h2>
            {/* Filter tabs */}
            <div className="flex gap-1 flex-wrap">
              {['all', 'approved', 'pending', 'rejected', 'draft'].map(f => (
                <button key={f} onClick={() => setPubFilter(f)}
                  className={`px-3 py-1 rounded-full font-ui text-xs font-semibold transition-all capitalize ${
                    pubFilter === f
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}>
                  {f === 'all' ? `All (${stats.total})` : f}
                </button>
              ))}
            </div>
          </div>

          {pubsLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center p-4 border border-slate-100 rounded-2xl">
                  <div className="skeleton h-16 w-16 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPubs.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="text-5xl mb-3">📝</div>
              <h3 className="font-display text-lg font-bold text-slate-700 mb-2">
                {pubFilter === 'all' ? 'No publications yet' : `No ${pubFilter} publications`}
              </h3>
              <p className="font-ui text-sm text-slate-400 mb-5">
                {pubFilter === 'all' ? 'Share your first sermon, testimony, or devotional with the community.' : 'Nothing here yet.'}
              </p>
              {pubFilter === 'all' && (
                <Link href="/submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-ui font-semibold text-sm rounded-xl transition-colors shadow-sm">
                  Submit Your First Article
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredPubs.map(pub => {
                const cfg = STATUS_CONFIG[pub.status] || STATUS_CONFIG.pending
                const Icon = cfg.icon
                const dateStr = new Date(pub.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })

                return (
                  <div key={pub.id} className="flex gap-4 items-start p-5 sm:p-6 hover:bg-slate-50/70 transition-colors group">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                      {pub.cover_image_url ? (
                        <Image src={pub.cover_image_url} alt={pub.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {pub.category === 'sermon' ? '🎙️'
                            : pub.category === 'devotional' || pub.category === 'devotion' ? '📖'
                            : pub.category === 'testimony' ? '✝️'
                            : pub.category === 'study' ? '📚'
                            : pub.category === 'news' ? '📰'
                            : '📄'}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 font-ui text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                          <Icon size={10} /> {cfg.label}
                        </span>
                        {/* Category badge */}
                        <span className={`font-ui text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${CAT_COLORS[pub.category] || CAT_COLORS.general}`}>
                          {pub.category === 'study' ? 'Bible Study' : pub.category}
                        </span>
                      </div>

                      <h3 className="font-display text-base font-bold text-slate-900 line-clamp-1 mb-0.5 leading-snug">
                        {pub.title}
                      </h3>
                      {pub.summary && (
                        <p className="font-body text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
                          {pub.summary}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-ui text-slate-400">
                        <span className="flex items-center gap-1"><HiCalendar size={11} /> {dateStr}</span>
                        {pub.like_count > 0 && <span>❤️ {pub.like_count}</span>}
                        {pub.comment_count > 0 && <span>💬 {pub.comment_count}</span>}
                        {pub.views > 0 && <span className="flex items-center gap-1"><HiEye size={11} /> {pub.views}</span>}
                      </div>
                    </div>

                    {/* View link */}
                    {pub.status === 'approved' && (
                      <Link href={`/publication/${pub.id}`}
                        className="flex-shrink-0 p-2 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="View publication">
                        <HiEye size={18} />
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Submit CTA */}
          {publications.length > 0 && (
            <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/50">
              <Link href="/submit"
                className="inline-flex items-center gap-2 text-sm font-ui font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                + Submit Another Article
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <footer className="hero-pattern text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="font-ui text-sm text-blue-300">© {new Date().getFullYear()} Silent Witness. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
