import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '../components/Navbar'
import { supabase, getYouTubeId } from '../lib/supabase'
import toast from 'react-hot-toast'
import {
  HiCheckCircle, HiXCircle, HiEye, HiTrash, HiRefresh,
  HiBadgeCheck, HiUsers, HiDocumentText, HiX, HiDownload,
  HiExternalLink, HiCalendar, HiClock, HiBookOpen, HiBell,
  HiPlus, HiPencil, HiSave, HiSpeakerphone
} from 'react-icons/hi'

const PUB_TABS = [
  { key: 'pending',  label: 'Pending',  dot: 'bg-amber-400' },
  { key: 'approved', label: 'Approved', dot: 'bg-green-400' },
  { key: 'rejected', label: 'Rejected', dot: 'bg-red-400' },
  { key: 'all',      label: 'All',      dot: 'bg-slate-400' },
]

const USER_TABS = [
  { key: 'all',    label: 'All Members' },
  { key: 'recent', label: 'Recent Joins' },
  { key: 'admins', label: 'Admins' },
]

const ROLE_COLORS = {
  superadmin: 'bg-purple-100 text-purple-700 border-purple-200',
  admin:      'bg-blue-100 text-blue-700 border-blue-200',
  member:     'bg-slate-100 text-slate-600 border-slate-200',
}

const CAT_COLORS = {
  sermon:'bg-blue-100 text-blue-700', devotional:'bg-purple-100 text-purple-700',
  testimony:'bg-green-100 text-green-700', study:'bg-amber-100 text-amber-700',
  news:'bg-rose-100 text-rose-700', general:'bg-slate-100 text-slate-700',
}

function PreviewModal({ pub, onClose, onApprove, onReject }) {
  if (!pub) return null
  const authorName = pub.profiles?.full_name || pub.author_name || 'Anonymous'
  const initials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  const dateStr = new Date(pub.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const ytId = pub.youtube_url ? getYouTubeId(pub.youtube_url) : null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4 pt-8">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mb-8 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className={`font-ui text-xs font-bold px-2.5 py-1 rounded-full border badge-${pub.status}`}>{pub.status}</span>
            <span className="font-ui text-sm font-semibold text-slate-600 truncate max-w-xs">{pub.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {pub.status !== 'approved' && (
              <button onClick={() => { onApprove(pub.id); onClose() }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-ui text-xs font-semibold transition-colors">
                <HiCheckCircle size={14} /> Approve
              </button>
            )}
            {pub.status !== 'rejected' && (
              <button onClick={() => { onReject(pub.id); onClose() }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-ui text-xs font-semibold transition-colors">
                <HiXCircle size={14} /> Reject
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors">
              <HiX size={18} />
            </button>
          </div>
        </div>
        {pub.cover_image_url && (
          <div className="relative h-56 w-full bg-slate-100">
            <Image src={pub.cover_image_url} alt={pub.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`text-xs font-ui font-bold px-3 py-1 rounded-full capitalize ${CAT_COLORS[pub.category] || CAT_COLORS.general}`}>
              {pub.category === 'study' ? 'Bible Study' : pub.category}
            </span>
            {pub.featured && <span className="text-xs font-ui font-bold px-3 py-1 rounded-full bg-amber-400 text-white">★ Featured</span>}
            {pub.pdf_url && <span className="text-xs font-ui font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">📄 PDF</span>}
            {ytId && <span className="text-xs font-ui font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">▶ Video</span>}
          </div>
          <h2 className="font-display text-2xl font-black text-slate-900 leading-tight mb-4">{pub.title}</h2>
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{initials}</div>
            <div>
              <div className="font-ui font-semibold text-sm text-slate-800">{authorName}</div>
              <div className="font-ui text-xs text-slate-400 flex items-center gap-1">
                <HiCalendar size={11} /> {dateStr}
                {pub.author_email && <span className="ml-2">· {pub.author_email}</span>}
              </div>
            </div>
          </div>
          {pub.summary && <p className="font-body text-lg text-slate-600 italic leading-relaxed mb-5 pb-5 border-b border-slate-100">{pub.summary}</p>}
          {pub.publication_images?.length > 0 && (
            <div className={`grid gap-3 mb-5 ${pub.publication_images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {pub.publication_images.map(img => (
                <figure key={img.id} className="rounded-xl overflow-hidden">
                  <div className="relative aspect-video bg-slate-100">
                    <Image src={img.url} alt={img.caption || ''} fill className="object-cover" />
                  </div>
                  {img.caption && <figcaption className="text-xs font-ui text-slate-500 text-center py-1.5 bg-slate-50 px-3">{img.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}
          {pub.content && (
            <div
              className="mb-6 prose-content"
              dangerouslySetInnerHTML={{ __html: pub.content }}
            />
          )}
          {ytId && (
            <div className="mb-6">
              <h3 className="font-display text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs">▶</span> Video
              </h3>
              <div className="relative pb-[56.25%] h-0 rounded-2xl overflow-hidden bg-black shadow-lg">
                <iframe className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                  title="YouTube video" frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />
              </div>
            </div>
          )}
          {pub.pdf_url && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-4 flex-wrap">
              <div className="text-3xl">📄</div>
              <div className="flex-1 min-w-0">
                <div className="font-ui font-bold text-sm text-slate-800">{pub.pdf_filename || 'Attached Document'}</div>
                <div className="font-ui text-xs text-slate-500">PDF document attached</div>
              </div>
              <div className="flex gap-2">
                <a href={pub.pdf_url} target="_blank" rel="noopener"
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white rounded-xl font-ui text-xs font-semibold">
                  <HiExternalLink size={13} /> View PDF
                </a>
                {pub.allow_download && (
                  <a href={pub.pdf_url} download
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-brand-200 text-brand-700 rounded-xl font-ui text-xs font-semibold">
                    <HiDownload size={13} /> Download
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPage({ user, profile, authReady, refreshProfile }) {
  const router = useRouter()
  const [section, setSection]         = useState('publications')
  const [pubTab, setPubTab]           = useState('pending')
  const [userTab, setUserTab]         = useState('all')
  const [pubs, setPubs]               = useState([])
  const [users, setUsers]             = useState([])
  const [pubLoading, setPubLoading]   = useState(true)
  const [userLoading, setUserLoading] = useState(false)
  const [counts, setCounts]           = useState({})
  const [previewPub, setPreviewPub]   = useState(null)

  // Daily Verse state
  const [verseDate, setVerseDate]         = useState(new Date().toISOString().split('T')[0])
  const [verseText, setVerseText]         = useState('')
  const [verseRef, setVerseRef]           = useState('')
  const [verseSaving, setVerseSaving]     = useState(false)
  const [verseLoading, setVerseLoading]   = useState(false)
  const [existingVerse, setExistingVerse] = useState(null)

  // Announcements state
  const [announcements, setAnnouncements]     = useState([])
  const [annLoading, setAnnLoading]           = useState(false)
  const [annTitle, setAnnTitle]               = useState('')
  const [annMessage, setAnnMessage]           = useState('')
  const [annExpires, setAnnExpires]           = useState('')
  const [annSaving, setAnnSaving]             = useState(false)
  const [editingAnn, setEditingAnn]           = useState(null)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'

  useEffect(() => {
    if (profile && !isAdmin) { toast.error('Access denied.'); router.push('/') }
  }, [profile])

  useEffect(() => { if (isAdmin) loadPublications(pubTab) }, [pubTab, isAdmin])

  async function loadPublications(status) {
    setPubLoading(true)
    let q = supabase
      .from('publications')
      .select('*')
      .order('created_at', { ascending: false })
    if (status !== 'all') q = q.eq('status', status)
    const { data } = await q
    setPubs(data || [])
    setPubLoading(false)
    loadCounts()
  }

  async function loadCounts() {
    const { data } = await supabase.from('publications').select('status')
    const c = { pending: 0, approved: 0, rejected: 0, all: 0 }
    data?.forEach(p => { c[p.status] = (c[p.status] || 0) + 1; c.all++ })
    setCounts(c)
  }

  async function review(id, status) {
    const { error } = await supabase.from('publications').update({
      status,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) { toast.error(error.message); return }

    toast.success(`Publication ${status}! ✓`)

    // ── Send notification email to the author ──────────────────────────────
    // Find the pub we just reviewed so we have author details
    const pub = pubs.find(p => p.id === id)
    const authorEmail = pub?.profiles?.email || pub?.author_email
    const authorName  = pub?.profiles?.full_name || pub?.author_name || 'Author'
    const pubTitle    = pub?.title || 'your submission'

    if (authorEmail) {
      try {
        const res = await fetch('/api/notify-author', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authorName,
            authorEmail,
            publicationTitle: pubTitle,
            status,
          }),
        })
        const data = await res.json()
        if (data.sent) {
          toast.success(`Email sent to ${authorEmail} 📧`, { duration: 4000 })
        } else if (data.warning) {
          // Env vars not configured — silently skip, don't alarm the admin
          console.warn('Email not sent:', data.warning)
        }
      } catch (emailErr) {
        // Never block the review workflow because of an email failure
        console.error('notify-author error:', emailErr)
      }
    }
    // ── End email notification ─────────────────────────────────────────────

    loadPublications(pubTab)
  }

  async function deletePub(id) {
    if (!confirm('Permanently delete this publication?')) return
    const { error } = await supabase.from('publications').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Deleted.')
    loadPublications(pubTab)
  }

  async function loadUsers() {
    setUserLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { toast.error(error.message); setUserLoading(false); return }
    setUsers(data || [])
    setUserLoading(false)
  }

  async function changeRole(userId, newRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (error) { toast.error('Failed: ' + error.message); return }
    toast.success(`User role updated to ${newRole}! ✓`)
    loadUsers()
    if (userId === user?.id) refreshProfile?.()
  }

  const filteredUsers = userTab === 'recent'
    ? users.slice(0, 20)
    : userTab === 'admins'
      ? users.filter(u => u.role === 'admin' || u.role === 'superadmin')
      : users

  // ── Daily Verse functions ─────────────────────────────────────────────────
  async function loadVerseForDate(date) {
    setVerseLoading(true)
    const { data } = await supabase
      .from('daily_verse')
      .select('*')
      .eq('verse_date', date)
      .maybeSingle()
    if (data) {
      setExistingVerse(data)
      setVerseText(data.verse_text)
      setVerseRef(data.verse_reference)
    } else {
      setExistingVerse(null)
      setVerseText('')
      setVerseRef('')
    }
    setVerseLoading(false)
  }

  async function saveVerse() {
    if (!verseText.trim() || !verseRef.trim()) { toast.error('Please fill in both fields.'); return }
    setVerseSaving(true)
    const payload = {
      verse_date: verseDate,
      verse_text: verseText.trim(),
      verse_reference: verseRef.trim(),
      created_by: user?.id,
    }
    const { error } = existingVerse
      ? await supabase.from('daily_verse').update(payload).eq('id', existingVerse.id)
      : await supabase.from('daily_verse').insert(payload)
    if (error) { toast.error(error.message) } else { toast.success('Verse saved! ✓'); loadVerseForDate(verseDate) }
    setVerseSaving(false)
  }

  async function deleteVerse() {
    if (!existingVerse) return
    const { error } = await supabase.from('daily_verse').delete().eq('id', existingVerse.id)
    if (error) { toast.error(error.message) } else { toast.success('Verse deleted.'); setExistingVerse(null); setVerseText(''); setVerseRef('') }
  }

  // ── Announcements functions ───────────────────────────────────────────────
  async function loadAnnouncements() {
    setAnnLoading(true)
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setAnnouncements(data || [])
    setAnnLoading(false)
  }

  async function saveAnnouncement() {
    if (!annTitle.trim() || !annMessage.trim()) { toast.error('Title and message are required.'); return }
    setAnnSaving(true)
    const payload = {
      title: annTitle.trim(),
      message: annMessage.trim(),
      expires_at: annExpires || null,
      created_by: user?.id,
      is_active: true,
    }
    const { error } = editingAnn
      ? await supabase.from('announcements').update(payload).eq('id', editingAnn.id)
      : await supabase.from('announcements').insert(payload)
    if (error) { toast.error(error.message) } else {
      toast.success(editingAnn ? 'Announcement updated! ✓' : 'Announcement posted! ✓')
      setAnnTitle(''); setAnnMessage(''); setAnnExpires(''); setEditingAnn(null)
      loadAnnouncements()
    }
    setAnnSaving(false)
  }

  async function toggleAnnouncement(id, isActive) {
    const { error } = await supabase.from('announcements').update({ is_active: !isActive }).eq('id', id)
    if (error) { toast.error(error.message) } else { loadAnnouncements() }
  }

  async function deleteAnnouncement(id) {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) { toast.error(error.message) } else { toast.success('Deleted.'); loadAnnouncements() }
  }

  function startEditAnn(ann) {
    setEditingAnn(ann)
    setAnnTitle(ann.title)
    setAnnMessage(ann.message)
    setAnnExpires(ann.expires_at || '')
  }

  // Show spinner while:
  //  - auth hasn't resolved yet, OR
  //  - auth resolved with a logged-in user but the profile hasn't arrived yet
  // This prevents the lock screen flashing for admins on slow connections.
  if (!authReady || (user && !profile)) return (
    <>
      <Navbar user={user} profile={profile} />
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="font-ui text-slate-500">Loading…</p>
        </div>
      </div>
    </>
  )

  // Auth and profile are both settled — now we can trust isAdmin
  if (!user || !isAdmin) return (
    <>
      <Navbar user={user} profile={profile} />
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="font-display text-2xl font-bold mb-2">Admin Access Only</h2>
          <p className="font-ui text-slate-500 mb-6">You must be signed in as an administrator.</p>
          <Link href="/" className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-ui font-semibold text-sm">Back to Home</Link>
        </div>
      </div>
    </>
  )

  return (
    <>
      <Head><title>Admin Panel — In Light of the Word</title></Head>
      <Navbar user={user} profile={profile} />
      {previewPub && (
        <PreviewModal
          pub={previewPub}
          onClose={() => setPreviewPub(null)}
          onApprove={(id) => review(id, 'approved')}
          onReject={(id) => review(id, 'rejected')}
        />
      )}
      <div className="hero-pattern py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">🛡 Admin Panel</h1>
            <p className="font-ui text-blue-200 text-sm mt-1">
              Signed in as <strong className="text-white">{profile?.full_name}</strong>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[profile?.role] || ''}`}>{profile?.role}</span>
            </p>
          </div>
          <div className="flex gap-5">
            {PUB_TABS.slice(0, 3).map(t => (
              <div key={t.key} className="text-center">
                <div className={`font-display text-2xl font-bold ${t.key === 'pending' ? 'text-gold-400' : t.key === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                  {counts[t.key] ?? '—'}
                </div>
                <div className="font-ui text-xs text-blue-300 uppercase tracking-wide">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-brand-800 border-b border-brand-700">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          <button onClick={() => { setSection('publications'); loadPublications(pubTab) }}
            className={`flex items-center gap-2 px-5 py-3 font-ui text-sm font-semibold border-b-2 transition-all flex-shrink-0 ${section === 'publications' ? 'border-white text-white' : 'border-transparent text-blue-300 hover:text-white'}`}>
            <HiDocumentText size={16} /> Publications
            {counts.pending > 0 && (
              <span className="bg-amber-400 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{counts.pending}</span>
            )}
          </button>
          <button onClick={() => { setSection('users'); loadUsers() }}
            className={`flex items-center gap-2 px-5 py-3 font-ui text-sm font-semibold border-b-2 transition-all flex-shrink-0 ${section === 'users' ? 'border-white text-white' : 'border-transparent text-blue-300 hover:text-white'}`}>
            <HiUsers size={16} /> Manage Users
          </button>
          <button onClick={() => { setSection('verse'); loadVerseForDate(verseDate) }}
            className={`flex items-center gap-2 px-5 py-3 font-ui text-sm font-semibold border-b-2 transition-all flex-shrink-0 ${section === 'verse' ? 'border-white text-white' : 'border-transparent text-blue-300 hover:text-white'}`}>
            <HiBookOpen size={16} /> Daily Verse
          </button>
          <button onClick={() => { setSection('announcements'); loadAnnouncements() }}
            className={`flex items-center gap-2 px-5 py-3 font-ui text-sm font-semibold border-b-2 transition-all flex-shrink-0 ${section === 'announcements' ? 'border-white text-white' : 'border-transparent text-blue-300 hover:text-white'}`}>
            <HiSpeakerphone size={16} /> Announcements
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {section === 'publications' && (
          <>
            <div className="flex gap-2 mb-6 flex-wrap items-center">
              {PUB_TABS.map(t => (
                <button key={t.key} onClick={() => setPubTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-ui text-sm font-semibold transition-all ${pubTab === t.key ? 'bg-brand-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'}`}>
                  <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                  {t.label}
                  {counts[t.key] > 0 && <span className={`text-xs font-bold ${pubTab === t.key ? 'text-blue-200' : 'text-slate-400'}`}>{counts[t.key]}</span>}
                </button>
              ))}
              <button onClick={() => loadPublications(pubTab)} className="ml-auto p-2 text-slate-400 hover:text-brand-600 transition-colors" title="Refresh">
                <HiRefresh size={18} />
              </button>
            </div>
            {pubLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
            ) : pubs.length === 0 ? (
              <div className="text-center py-20"><div className="text-4xl mb-3">📭</div><h3 className="font-display text-xl font-bold text-slate-600">No {pubTab} publications</h3></div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        {['Title', 'Author', 'Category', 'Date', 'Status', 'Media', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-ui text-xs font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pubs.map(pub => {
                        const authorName = pub.profiles?.full_name || pub.author_name || 'Guest'
                        const date = new Date(pub.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
                        return (
                          <tr key={pub.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-ui font-semibold text-sm text-slate-800 max-w-[180px] truncate">{pub.title}</div>
                              {pub.summary && <div className="font-ui text-xs text-slate-400 truncate max-w-[180px]">{pub.summary}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-ui text-sm text-slate-700 font-medium">{authorName}</div>
                              {pub.author_email && <div className="font-ui text-xs text-slate-400">{pub.author_email}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-ui text-xs font-semibold capitalize bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">
                                {pub.category === 'study' ? 'Bible Study' : pub.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-ui text-xs text-slate-500 whitespace-nowrap">{date}</td>
                            <td className="px-4 py-3">
                              <span className={`font-ui text-xs font-bold px-2.5 py-1 rounded-full border badge-${pub.status}`}>{pub.status}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 text-base">
                                {pub.pdf_url && <span title="Has PDF">📄</span>}
                                {pub.youtube_url && <span title="Has Video">▶️</span>}
                                {pub.cover_image_url && <span title="Has Cover">🖼️</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button onClick={() => setPreviewPub(pub)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Preview"><HiEye size={15} /></button>
                                {pub.status !== 'approved' && <button onClick={() => review(pub.id, 'approved')} title="Approve" className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><HiCheckCircle size={15} /></button>}
                                {pub.status !== 'rejected' && <button onClick={() => review(pub.id, 'rejected')} title="Reject" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><HiXCircle size={15} /></button>}
                                <button onClick={() => deletePub(pub.id)} title="Delete" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><HiTrash size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
        {section === 'users' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-slate-800">Users <span className="text-slate-400 font-normal text-base">({users.length})</span></h2>
              <button onClick={loadUsers} className="p-2 text-slate-400 hover:text-brand-600 transition-colors" title="Refresh"><HiRefresh size={18} /></button>
            </div>
            <div className="flex gap-2 mb-6 flex-wrap">
              {USER_TABS.map(t => (
                <button key={t.key} onClick={() => setUserTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-ui text-sm font-semibold transition-all ${userTab === t.key ? 'bg-brand-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'}`}>
                  {t.key === 'recent' && <HiClock size={14} />}
                  {t.key === 'admins' && <HiBadgeCheck size={14} />}
                  {t.label}
                  {t.key === 'all' && users.length > 0 && <span className={`text-xs font-bold ${userTab === t.key ? 'text-blue-200' : 'text-slate-400'}`}>{users.length}</span>}
                  {t.key === 'admins' && <span className={`text-xs font-bold ${userTab === t.key ? 'text-blue-200' : 'text-slate-400'}`}>{users.filter(u => u.role === 'admin' || u.role === 'superadmin').length}</span>}
                </button>
              ))}
            </div>
            {userTab === 'recent' && (
              <div className="mb-4 flex items-center gap-2 text-sm font-ui text-slate-500">
                <HiClock size={15} className="text-brand-500" /> Showing the 20 most recently joined members
              </div>
            )}
            {userLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16"><div className="text-4xl mb-3">👤</div><h3 className="font-display text-lg font-bold text-slate-500">No users in this view</h3></div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      {['User', 'Email', 'Joined', 'Role', 'Change Role'].map(h => (
                        <th key={h} className="text-left px-5 py-3 font-ui text-xs font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => {
                      const joinedDate = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'
                      return (
                        <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold shrink-0">{(u.full_name || 'U').charAt(0).toUpperCase()}</div>
                              <div className="font-ui font-semibold text-sm text-slate-800">{u.full_name || '—'}{u.id === user?.id && <span className="ml-2 text-xs text-brand-500 font-normal">(you)</span>}</div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-ui text-sm text-slate-500">{u.email}</td>
                          <td className="px-5 py-4 font-ui text-xs text-slate-400 whitespace-nowrap">{joinedDate}</td>
                          <td className="px-5 py-4"><span className={`font-ui text-xs font-bold px-2.5 py-1 rounded-full border ${ROLE_COLORS[u.role] || ROLE_COLORS.member}`}>{u.role || 'member'}</span></td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2 flex-wrap">
                              {u.role !== 'admin' && u.role !== 'superadmin' && (
                                <button onClick={() => changeRole(u.id, 'admin')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-ui text-xs font-semibold transition-colors"><HiBadgeCheck size={14} /> Make Admin</button>
                              )}
                              {u.role === 'admin' && u.id !== user?.id && (
                                <button onClick={() => changeRole(u.id, 'member')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg font-ui text-xs font-semibold transition-colors">Remove Admin</button>
                              )}
                              {profile?.role === 'superadmin' && u.role !== 'superadmin' && (
                                <button onClick={() => changeRole(u.id, 'superadmin')} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-ui text-xs font-semibold transition-colors">Make Superadmin</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl font-ui text-sm text-slate-600">
              <strong className="text-brand-800">Role levels:</strong>
              <span className="ml-2">Member → can submit articles.</span>
              <span className="ml-2">Admin → can approve/reject + manage users.</span>
              <span className="ml-2">Superadmin → full access including promoting admins.</span>
            </div>
          </>
        )}

        {/* ── Daily Verse Section ─────────────────────────────────────────── */}
        {section === 'verse' && (
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center">
                <HiBookOpen size={20} className="text-brand-600" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-slate-800">Daily Verse</h2>
                <p className="font-ui text-sm text-slate-500">Set the verse that pops up for all visitors each day.</p>
              </div>
            </div>

            {/* Date picker */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
              <label className="block font-ui text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Date</label>
              <input
                type="date"
                value={verseDate}
                onChange={e => { setVerseDate(e.target.value); loadVerseForDate(e.target.value) }}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-ui text-sm focus:border-brand-400 outline-none transition-shadow focus:shadow-md"
              />
              {existingVerse && (
                <div className="mt-2 flex items-center gap-1.5 font-ui text-xs text-green-600 font-semibold">
                  <HiCheckCircle size={13} /> Verse already set for this date
                </div>
              )}
            </div>

            {verseLoading ? (
              <div className="space-y-3">
                <div className="h-24 bg-white rounded-xl animate-pulse border border-slate-100" />
                <div className="h-12 bg-white rounded-xl animate-pulse border border-slate-100" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div>
                  <label className="block font-ui text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Verse Text</label>
                  <textarea
                    value={verseText}
                    onChange={e => setVerseText(e.target.value)}
                    rows={4}
                    placeholder="For God so loved the world that he gave his one and only Son…"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 font-body text-base focus:border-brand-400 outline-none transition-shadow focus:shadow-md resize-none"
                  />
                </div>
                <div>
                  <label className="block font-ui text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Reference</label>
                  <input
                    value={verseRef}
                    onChange={e => setVerseRef(e.target.value)}
                    placeholder="John 3:16"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-ui text-sm focus:border-brand-400 outline-none transition-shadow focus:shadow-md"
                  />
                </div>

                {/* Preview */}
                {verseText && verseRef && (
                  <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-center">
                    <p className="font-body text-base italic text-slate-700 leading-relaxed mb-2">&ldquo;{verseText}&rdquo;</p>
                    <p className="font-ui text-xs font-bold text-brand-600 tracking-widest uppercase">— {verseRef}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={saveVerse}
                    disabled={verseSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-ui font-semibold text-sm transition-colors disabled:opacity-60 min-h-[40px]"
                  >
                    <HiSave size={15} /> {verseSaving ? 'Saving…' : existingVerse ? 'Update Verse' : 'Save Verse'}
                  </button>
                  {existingVerse && (
                    <button
                      onClick={deleteVerse}
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-ui font-semibold text-sm transition-colors"
                    >
                      <HiTrash size={14} /> Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Announcements Section ───────────────────────────────────────── */}
        {section === 'announcements' && (
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                <HiSpeakerphone size={20} className="text-amber-600" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-slate-800">Announcements</h2>
                <p className="font-ui text-sm text-slate-500">Post messages visible to everyone on the homepage.</p>
              </div>
            </div>

            {/* Create / Edit form */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
              <h3 className="font-ui text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                {editingAnn ? <><HiPencil size={14} /> Edit Announcement</> : <><HiPlus size={14} /> New Announcement</>}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block font-ui text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Title</label>
                  <input
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    placeholder="Sabbath Service Time Change"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-ui text-sm focus:border-amber-400 outline-none transition-shadow focus:shadow-md"
                  />
                </div>
                <div>
                  <label className="block font-ui text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Message</label>
                  <textarea
                    value={annMessage}
                    onChange={e => setAnnMessage(e.target.value)}
                    rows={3}
                    placeholder="This Sabbath's service will begin at 10:00 AM instead of the usual 9:30 AM."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 font-ui text-sm focus:border-amber-400 outline-none transition-shadow focus:shadow-md resize-none"
                  />
                </div>
                <div>
                  <label className="block font-ui text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Expires On <span className="text-slate-400 font-normal normal-case">(optional — leave blank to keep active)</span>
                  </label>
                  <input
                    type="date"
                    value={annExpires}
                    onChange={e => setAnnExpires(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-ui text-sm focus:border-amber-400 outline-none transition-shadow focus:shadow-md"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={saveAnnouncement}
                    disabled={annSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-ui font-semibold text-sm transition-colors disabled:opacity-60 min-h-[40px]"
                  >
                    <HiSave size={15} /> {annSaving ? 'Saving…' : editingAnn ? 'Update' : 'Post Announcement'}
                  </button>
                  {editingAnn && (
                    <button
                      onClick={() => { setEditingAnn(null); setAnnTitle(''); setAnnMessage(''); setAnnExpires('') }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-ui font-semibold text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Announcements list */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-ui text-sm font-bold text-slate-700">All Announcements ({announcements.length})</h3>
              <button onClick={loadAnnouncements} className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors" title="Refresh">
                <HiRefresh size={16} />
              </button>
            </div>

            {annLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <div className="text-4xl mb-3">📣</div>
                <p className="font-ui text-slate-500 text-sm">No announcements yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map(ann => (
                  <div key={ann.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${ann.is_active ? 'border-slate-100' : 'border-slate-100 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-ui font-bold text-sm text-slate-800">{ann.title}</span>
                          <span className={`font-ui text-[10px] font-bold px-2 py-0.5 rounded-full ${ann.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {ann.is_active ? 'Active' : 'Hidden'}
                          </span>
                          {ann.expires_at && (
                            <span className="font-ui text-[10px] text-slate-400">
                              Expires {new Date(ann.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="font-ui text-sm text-slate-600 leading-relaxed">{ann.message}</p>
                        <p className="font-ui text-[10px] text-slate-400 mt-1">
                          Posted {new Date(ann.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => startEditAnn(ann)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Edit">
                          <HiPencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleAnnouncement(ann.id, ann.is_active)}
                          className={`p-1.5 rounded-lg transition-colors ${ann.is_active ? 'text-green-500 hover:text-slate-500 hover:bg-slate-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}
                          title={ann.is_active ? 'Hide' : 'Show'}
                        >
                          <HiEye size={14} />
                        </button>
                        <button onClick={() => deleteAnnouncement(ann.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <HiTrash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
