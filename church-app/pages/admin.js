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
  HiExternalLink, HiCalendar, HiClock
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

// ── Inline Preview Modal ──────────────────────────────────────────────────────
function PreviewModal({ pub, onClose, onApprove, onReject }) {
  if (!pub) return null
  const authorName = pub.profiles?.full_name || pub.author_name || 'Anonymous'
  const initials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  const dateStr = new Date(pub.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const ytId = pub.youtube_url ? getYouTubeId(pub.youtube_url) : null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4 pt-8">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mb-8 overflow-hidden">

        {/* Modal toolbar */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className={`font-ui text-xs font-bold px-2.5 py-1 rounded-full border badge-${pub.status}`}>
              {pub.status}
            </span>
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
            <button onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors">
              <HiX size={18} />
            </button>
          </div>
        </div>

        {/* Cover image */}
        {pub.cover_image_url && (
          <div className="relative h-56 w-full bg-slate-100">
            <Image src={pub.cover_image_url} alt={pub.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <div className="p-6">
          {/* Category + badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`text-xs font-ui font-bold px-3 py-1 rounded-full capitalize ${CAT_COLORS[pub.category] || CAT_COLORS.general}`}>
              {pub.category === 'study' ? 'Bible Study' : pub.category}
            </span>
            {pub.featured && <span className="text-xs font-ui font-bold px-3 py-1 rounded-full bg-amber-400 text-white">★ Featured</span>}
            {pub.pdf_url && <span className="text-xs font-ui font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">📄 PDF</span>}
            {ytId && <span className="text-xs font-ui font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">▶ Video</span>}
          </div>

          {/* Title */}
          <h2 className="font-display text-2xl font-black text-slate-900 leading-tight mb-4">{pub.title}</h2>

          {/* Author + date */}
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div>
              <div className="font-ui font-semibold text-sm text-slate-800">{authorName}</div>
              <div className="font-ui text-xs text-slate-400 flex items-center gap-1">
                <HiCalendar size={11} /> {dateStr}
                {pub.author_email && <span className="ml-2">· {pub.author_email}</span>}
              </div>
            </div>
          </div>

          {/* Summary */}
          {pub.summary && (
            <p className="font-body text-lg text-slate-600 italic leading-relaxed mb-5 pb-5 border-b border-slate-100">
              {pub.summary}
            </p>
          )}

          {/* Inline images */}
          {pub.publication_images?.length > 0 && (
            <div className={`grid gap-3 mb-5 ${pub.publication_images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {pub.publication_images.map(img => (
                <figure key={img.id} className="rounded-xl overflow-hidden">
                  <div className="relative aspect-video bg-slate-100">
                    <Image src={img.url} alt={img.caption || ''} fill className="object-cover" />
                  </div>
                  {img.caption && (
                    <figcaption className="text-xs font-ui text-slate-500 text-center py-1.5 bg-slate-50 px-3">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}

          {/* Body content */}
          {pub.content && (
            <div className="mb-6">
              {pub.content.split('\n').filter(p => p.trim()).map((para, i) => (
                <p key={i} className="font-body text-base text-slate-700 leading-loose mb-3">{para}</p>
              ))}
            </div>
          )}

          {/* YouTube embed */}
          {ytId && (
            <div className="mb-6">
              <h3 className="font-display text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs">▶</span>
                Video
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

          {/* PDF banner */}
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

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage({ user, profile, refreshProfile }) {
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
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'

  useEffect(() => {
    if (profile && !isAdmin) { toast.error('Access denied.'); router.push('/') }
  }, [profile])

  useEffect(() => { if (isAdmin) loadPublications(pubTab) }, [pubTab, isAdmin])

  // ── Publications ──
  async function loadPublications(status) {
    setPubLoading(true)
    // FIX: use profiles!author_id to avoid ambiguity with reviewed_by FK
    let q = supabase
      .from('publications')
      .select('*, profiles!author_id(full_name, email), publication_images(*)')
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
    loadPublications(pubTab)
  }

  async function deletePub(id) {
    if (!confirm('Permanently delete this publication?')) return
    const { error } = await supabase.from('publications').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Deleted.')
    loadPublications(pubTab)
  }

  // ── Users ──
  async function loadUsers() {
    setUserLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })   // FIX: sort by join date
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

  // Filtered user lists for tabs
  const filteredUsers = userTab === 'recent'
    ? users.slice(0, 20)               // already sorted by created_at desc
    : userTab === 'admins'
      ? users.filter(u => u.role === 'admin' || u.role === 'superadmin')
      : users

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
      <Head><title>Admin Panel — Three Angels Publications</title></Head>
      <Navbar user={user} profile={profile} />

      {/* Preview modal */}
      {previewPub && (
        <PreviewModal
          pub={previewPub}
          onClose={() => setPreviewPub(null)}
          onApprove={(id) => review(id, 'approved')}
          onReject={(id) => review(id, 'rejected')}
        />
      )}

      {/* Header */}
      <div className="hero-pattern py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">🛡 Admin Panel</h1>
            <p className="font-ui text-blue-200 text-sm mt-1">
              Signed in as <strong className="text-white">{profile?.full_name}</strong>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[profile?.role] || ''}`}>
                {profile?.role}
              </span>
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

      {/* Section switcher */}
      <div className="bg-brand-800 border-b border-brand-700">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          <button
            onClick={() => { setSection('publications'); loadPublications(pubTab) }}
            className={`flex items-center gap-2 px-5 py-3 font-ui text-sm font-semibold border-b-2 transition-all ${
              section === 'publications'
                ? 'border-white text-white'
                : 'border-transparent text-blue-300 hover:text-white'
            }`}>
            <HiDocumentText size={16} /> Publications
            {counts.pending > 0 && (
              <span className="bg-amber-400 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {counts.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => { setSection('users'); loadUsers() }}
            className={`flex items-center gap-2 px-5 py-3 font-ui text-sm font-semibold border-b-2 transition-all ${
              section === 'users'
                ? 'border-white text-white'
                : 'border-transparent text-blue-300 hover:text-white'
            }`}>
            <HiUsers size={16} /> Manage Users
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── PUBLICATIONS SECTION ── */}
        {section === 'publications' && (
          <>
            <div className="flex gap-2 mb-6 flex-wrap items-center">
              {PUB_TABS.map(t => (
                <button key={t.key} onClick={() => setPubTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-ui text-sm font-semibold transition-all ${
                    pubTab === t.key
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                  {t.label}
                  {counts[t.key] > 0 && (
                    <span className={`text-xs font-bold ${pubTab === t.key ? 'text-blue-200' : 'text-slate-400'}`}>
                      {counts[t.key]}
                    </span>
                  )}
                </button>
              ))}
              <button onClick={() => loadPublications(pubTab)} className="ml-auto p-2 text-slate-400 hover:text-brand-600 transition-colors" title="Refresh">
                <HiRefresh size={18} />
              </button>
            </div>

            {pubLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-100" />)}
              </div>
            ) : pubs.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-3">📭</div>
                <h3 className="font-display text-xl font-bold text-slate-600">No {pubTab} publications</h3>
              </div>
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
                        // FIX: use profiles!author_id data, fall back to stored author_name
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
                              <span className={`font-ui text-xs font-bold px-2.5 py-1 rounded-full border badge-${pub.status}`}>
                                {pub.status}
                              </span>
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
                                {/* FIX: preview opens inline modal, works for any status */}
                                <button
                                  onClick={() => setPreviewPub(pub)}
                                  className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                  title="Preview">
                                  <HiEye size={15} />
                                </button>
                                {pub.status !== 'approved' && (
                                  <button onClick={() => review(pub.id, 'approved')} title="Approve"
                                    className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                    <HiCheckCircle size={15} />
                                  </button>
                                )}
                                {pub.status !== 'rejected' && (
                                  <button onClick={() => review(pub.id, 'rejected')} title="Reject"
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <HiXCircle size={15} />
                                  </button>
                                )}
                                <button onClick={() => deletePub(pub.id)} title="Delete"
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <HiTrash size={15} />
                                </button>
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

        {/* ── USERS SECTION ── */}
        {section === 'users' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-slate-800">
                Users <span className="text-slate-400 font-normal text-base">({users.length})</span>
              </h2>
              <button onClick={loadUsers} className="p-2 text-slate-400 hover:text-brand-600 transition-colors" title="Refresh">
                <HiRefresh size={18} />
              </button>
            </div>

            {/* FIX: user sub-tabs for All / Recent / Admins */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {USER_TABS.map(t => (
                <button key={t.key} onClick={() => setUserTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-ui text-sm font-semibold transition-all ${
                    userTab === t.key
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}>
                  {t.key === 'recent' && <HiClock size={14} />}
                  {t.key === 'admins' && <HiBadgeCheck size={14} />}
                  {t.label}
                  {t.key === 'all' && users.length > 0 && (
                    <span className={`text-xs font-bold ${userTab === t.key ? 'text-blue-200' : 'text-slate-400'}`}>{users.length}</span>
                  )}
                  {t.key === 'admins' && (
                    <span className={`text-xs font-bold ${userTab === t.key ? 'text-blue-200' : 'text-slate-400'}`}>
                      {users.filter(u => u.role === 'admin' || u.role === 'superadmin').length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {userTab === 'recent' && (
              <div className="mb-4 flex items-center gap-2 text-sm font-ui text-slate-500">
                <HiClock size={15} className="text-brand-500" />
                Showing the 20 most recently joined members
              </div>
            )}

            {userLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-100" />)}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">👤</div>
                <h3 className="font-display text-lg font-bold text-slate-500">No users in this view</h3>
              </div>
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
                      const joinedDate = u.created_at
                        ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
                        : '—'
                      return (
                        <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {(u.full_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="font-ui font-semibold text-sm text-slate-800">
                                {u.full_name || '—'}
                                {u.id === user?.id && <span className="ml-2 text-xs text-brand-500 font-normal">(you)</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-ui text-sm text-slate-500">{u.email}</td>
                          <td className="px-5 py-4 font-ui text-xs text-slate-400 whitespace-nowrap">{joinedDate}</td>
                          <td className="px-5 py-4">
                            <span className={`font-ui text-xs font-bold px-2.5 py-1 rounded-full border ${ROLE_COLORS[u.role] || ROLE_COLORS.member}`}>
                              {u.role || 'member'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2 flex-wrap">
                              {u.role !== 'admin' && u.role !== 'superadmin' && (
                                <button onClick={() => changeRole(u.id, 'admin')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-ui text-xs font-semibold transition-colors">
                                  <HiBadgeCheck size={14} /> Make Admin
                                </button>
                              )}
                              {u.role === 'admin' && u.id !== user?.id && (
                                <button onClick={() => changeRole(u.id, 'member')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg font-ui text-xs font-semibold transition-colors">
                                  Remove Admin
                                </button>
                              )}
                              {profile?.role === 'superadmin' && u.role !== 'superadmin' && (
                                <button onClick={() => changeRole(u.id, 'superadmin')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-ui text-xs font-semibold transition-colors">
                                  Make Superadmin
                                </button>
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
      </div>
    </>
  )
}
