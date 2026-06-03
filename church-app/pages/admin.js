import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '../components/Navbar'
import { supabase, getYouTubeId } from '../lib/supabase'
import toast from 'react-hot-toast'
import {
  HiCheckCircle, HiXCircle, HiEye, HiTrash, HiRefresh, HiPencil,
  HiBadgeCheck, HiUsers, HiDocumentText, HiX, HiDownload,
  HiExternalLink, HiCalendar, HiClock, HiSpeakerphone,
  HiBookOpen, HiVideoCamera, HiMail, HiPlusCircle, HiChat,
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
              <button onClick={() => { onApprove(pub.id); onClose() }} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-ui text-xs font-semibold transition-colors"><HiCheckCircle size={14} /> Approve</button>
            )}
            {pub.status !== 'rejected' && (
              <button onClick={() => { onReject(pub.id); onClose() }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-ui text-xs font-semibold transition-colors"><HiXCircle size={14} /> Reject</button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"><HiX size={18} /></button>
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
          {pub.content && <div className="mb-6 prose-content" dangerouslySetInnerHTML={{ __html: pub.content }} />}
          {ytId && (
            <div className="mb-6">
              <div className="relative pb-[56.25%] h-0 rounded-2xl overflow-hidden bg-black shadow-lg">
                <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${ytId}?rel=0`} title="YouTube video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
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
                <a href={pub.pdf_url} target="_blank" rel="noopener" className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white rounded-xl font-ui text-xs font-semibold"><HiExternalLink size={13} /> View PDF</a>
                {pub.allow_download && (
                  <a href={pub.pdf_url} download className="flex items-center gap-1 px-3 py-1.5 bg-white border border-brand-200 text-brand-700 rounded-xl font-ui text-xs font-semibold"><HiDownload size={13} /> Download</a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// ── Lightweight rich-text editor for devotionals ──────────────────────────────
function DevotionalEditor({ value, onChange }) {
  const editorRef = useRef(null)
  const fileRef   = useRef(null)
  const [showLink, setShowLink] = useState(false)
  const [linkUrl, setLinkUrl]   = useState('')
  const [linkText, setLinkText] = useState('')
  const savedRange = useRef(null)

  // Import useRef and useState are already in scope from admin page

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || ''
    }
  }, []) // eslint-disable-line

  function exec(cmd, val = null) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    onChange(editorRef.current?.innerHTML || '')
  }

  function saveSelection() {
    const sel = window.getSelection()
    if (sel?.rangeCount) savedRange.current = sel.getRangeAt(0).cloneRange()
  }
  function restoreSelection() {
    const sel = window.getSelection()
    if (savedRange.current && sel) { sel.removeAllRanges(); sel.addRange(savedRange.current) }
    editorRef.current?.focus()
  }

  async function handleImageUpload(file) {
    if (!file) return
    const bucket = 'devotional-images'
    const path = `${Date.now()}-${file.name.replace(/\s+/g,'-')}`
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) { import('react-hot-toast').then(m => m.default.error('Image upload failed')); return }
    const { data } = sb.storage.from(bucket).getPublicUrl(path)
    restoreSelection()
    exec('insertHTML', `<img src="${data.publicUrl}" alt="" style="max-width:100%;border-radius:8px;margin:6px 0;display:block" />`)
  }

  function insertLink() {
    restoreSelection()
    const text = linkText.trim() || linkUrl
    exec('insertHTML', `<a href="${linkUrl}" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline">${text}</a>`)
    setShowLink(false); setLinkUrl(''); setLinkText('')
  }

  const TOOLBAR = [
    { label: 'B', title: 'Bold',      cmd: 'bold',          style: 'font-bold' },
    { label: 'I', title: 'Italic',    cmd: 'italic',        style: 'italic' },
    { label: 'U', title: 'Underline', cmd: 'underline',     style: 'underline' },
  ]

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-purple-400 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
        {TOOLBAR.map(t => (
          <button key={t.cmd} type="button" title={t.title}
            onMouseDown={e => { e.preventDefault(); exec(t.cmd) }}
            className={`w-7 h-7 rounded-lg font-ui text-sm text-slate-600 hover:bg-white hover:shadow-sm transition-all flex items-center justify-center ${t.style}`}>
            {t.label}
          </button>
        ))}
        <div className="w-px h-5 bg-slate-200 mx-1" />
        {/* Link */}
        <button type="button" title="Insert link"
          onMouseDown={e => { e.preventDefault(); saveSelection(); setShowLink(v => !v) }}
          className="w-7 h-7 rounded-lg font-ui text-xs text-blue-600 hover:bg-white hover:shadow-sm transition-all flex items-center justify-center font-bold">
          🔗
        </button>
        {/* Image */}
        <button type="button" title="Insert image"
          onMouseDown={e => { e.preventDefault(); saveSelection(); fileRef.current?.click() }}
          className="w-7 h-7 rounded-lg font-ui text-xs hover:bg-white hover:shadow-sm transition-all flex items-center justify-center">
          🖼️
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }} />
      </div>

      {/* Link input */}
      {showLink && (
        <div className="flex gap-2 px-3 py-2 bg-blue-50 border-b border-blue-100">
          <input value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Link text (optional)"
            className="flex-1 px-2 py-1 text-xs border border-blue-200 rounded-lg outline-none focus:border-blue-400 bg-white font-ui" />
          <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://…"
            className="flex-1 px-2 py-1 text-xs border border-blue-200 rounded-lg outline-none focus:border-blue-400 bg-white font-ui" />
          <button type="button" onClick={insertLink}
            className="px-3 py-1 bg-blue-600 text-white text-xs font-ui font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Add
          </button>
          <button type="button" onClick={() => setShowLink(false)}
            className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs rounded-lg hover:bg-slate-100 transition-colors">
            ✕
          </button>
        </div>
      )}

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || '')}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); exec('insertParagraph') } }}
        data-placeholder="Write the devotional reflection here…"
        className="min-h-[140px] px-3 py-2.5 font-body text-sm text-slate-700 leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
      />
    </div>
  )
}

export default function AdminPage({ user, profile, authReady, refreshProfile }) {
  const router = useRouter()
  const [section, setSection]             = useState('publications')
  const [pubTab, setPubTab]               = useState('pending')
  const [userTab, setUserTab]             = useState('all')
  const [pubs, setPubs]                   = useState([])
  const [users, setUsers]                 = useState([])
  const [counts, setCounts]               = useState({})
  const [pubLoading, setPubLoading]       = useState(false)
  const [userLoading, setUserLoading]     = useState(false)
  const [previewPub, setPreviewPub]       = useState(null)

  const [devotionals, setDevotionals]         = useState([])
  const [devotLoading, setDevotLoading]       = useState(false)
  const [devotForm, setDevotForm]             = useState({ title:'', verse:'', verse_reference:'', content:'', published_date: new Date().toISOString().split('T')[0] })
  const [devotSubmitting, setDevotSubmitting] = useState(false)

  const [sermons, setSermons]                   = useState([])
  const [seriesList, setSeriesList]             = useState([])
  const [seriesForm, setSeriesForm]             = useState({ title:'', speaker:'', description:'', playlist_url:'', thumbnail_url:'' })
  const [seriesSubmitting, setSeriesSubmitting] = useState(false)
  const [sermonLoading, setSermonLoading]       = useState(false)
  const [sermonForm, setSermonForm]             = useState({ title:'', speaker:'', sermon_date: new Date().toISOString().split('T')[0], youtube_url:'', description:'' })
  const [sermonSubmitting, setSermonSubmitting] = useState(false)
  const [sermonSubTab, setSermonSubTab]         = useState('sermons')


  const [annForm, setAnnForm]         = useState({ title:'', message:'', link:'' })
  const [annSending, setAnnSending]   = useState(false)
  const [annHistory, setAnnHistory]   = useState([])

  useEffect(() => {
    if (!authReady) return
    if (!user) { router.replace('/'); return }
    if (!['admin', 'superadmin'].includes(profile?.role)) { router.replace('/'); return }
    loadPublications('pending')
    loadCounts()
  }, [authReady, user, profile]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPublications(status) {
    setPubLoading(true)
    let q = supabase.from('publications').select('*, profiles(full_name, email)').order('created_at', { ascending: false })
    if (status !== 'all') q = q.eq('status', status)
    const { data } = await q
    setPubs(data || [])
    setPubLoading(false)
  }
  async function loadCounts() {
    const [p, a, r] = await Promise.all([
      supabase.from('publications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('publications').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('publications').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    ])
    setCounts({ pending: p.count ?? 0, approved: a.count ?? 0, rejected: r.count ?? 0 })
  }
  async function review(id, status) {
    const pub = pubs.find(p => p.id === id)
    const { error } = await supabase.from('publications').update({ status }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(status === 'approved' ? '✅ Approved!' : '❌ Rejected')
    loadPublications(pubTab); loadCounts()
    if (status === 'approved' && pub) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        await fetch('/api/notify-author', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorName: pub.profiles?.full_name || pub.author_name, authorEmail: pub.author_email, publicationTitle: pub.title, status }),
        })
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dekusdaschool.vercel.app'
        await fetch('/api/send-newsletter', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ type: 'publication', title: pub.title, summary: pub.summary, link: `${siteUrl}/publication/${pub.id}`, authorName: pub.profiles?.full_name || pub.author_name }),
        })
      } catch (_) {}
    }
  }
  async function deletePub(id) {
    if (!confirm('Delete this publication permanently?')) return
    const { error } = await supabase.from('publications').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Deleted'); loadPublications(pubTab); loadCounts()
  }

  function startEditPub(pub) {
    // Redirect to the full submit/edit page which has the complete rich text editor,
    // cover image, PDF, YouTube URL, and all other fields.
    router.push(`/submit?edit=${pub.id}`)
  }
  async function loadUsers() {
    setUserLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setUserLoading(false)
  }
  async function changeRole(userId, newRole) {
    if (!confirm(`Change this user's role to ${newRole}?`)) return
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) { toast.error(error.message); return }
    toast.success(`Role updated to ${newRole}`); loadUsers()
  }

  async function loadDevotionals() {
    setDevotLoading(true)
    const { data } = await supabase.from('devotionals').select('*').order('published_date', { ascending: false }).limit(20)
    setDevotionals(data || [])
    setDevotLoading(false)
  }
  async function submitDevotional(e) {
    e.preventDefault()
    if (!devotForm.title || !devotForm.content) { toast.error('Title and content are required'); return }
    setDevotSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    const r = await fetch('/api/devotional', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify(devotForm),
    })
    const json = await r.json()
    setDevotSubmitting(false)
    if (!r.ok) { toast.error(json.error || 'Failed'); return }
    toast.success('🙏 Devotional posted!')
    setDevotForm({ title:'', verse:'', verse_reference:'', content:'', published_date: new Date().toISOString().split('T')[0] })
    loadDevotionals()
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dekusdaschool.vercel.app'
      await fetch('/api/send-newsletter', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ type: 'devotional', title: devotForm.title, summary: devotForm.verse ? `"${devotForm.verse}" — ${devotForm.verse_reference}` : '', link: siteUrl }),
      })
    } catch (_) {}
  }
  async function deleteDevotional(id) {
    if (!confirm('Delete this devotional?')) return
    await supabase.from('devotionals').delete().eq('id', id)
    toast.success('Deleted'); loadDevotionals()
  }

  async function loadSermons() {
    setSermonLoading(true)
    const { data } = await supabase.from('sermons').select('*').order('sermon_date', { ascending: false }).limit(30)
    setSermons(data || [])
    setSermonLoading(false)
  }
  async function submitSermon(e) {
    e.preventDefault()
    if (!sermonForm.title || !sermonForm.youtube_url) { toast.error('Title and YouTube URL are required'); return }
    setSermonSubmitting(true)
    const { error } = await supabase.from('sermons').insert({
      title: sermonForm.title, speaker: sermonForm.speaker || null,
      sermon_date: sermonForm.sermon_date || null, youtube_url: sermonForm.youtube_url,
      description: sermonForm.description || null, added_by: user.id,
    })
    setSermonSubmitting(false)
    if (error) { toast.error(error.message); return }
    toast.success('🎙️ Sermon added!')
    setSermonForm({ title:'', speaker:'', sermon_date: new Date().toISOString().split('T')[0], youtube_url:'', description:'' })
    loadSermons()
  }
  async function deleteSermon(id) {
    if (!confirm('Delete this sermon?')) return
    await supabase.from('sermons').delete().eq('id', id)
    toast.success('Deleted'); loadSermons()
  }

  async function loadSeriesList() {
    const { data } = await supabase.from('sermon_series').select('*').order('created_at', { ascending: false })
    setSeriesList(data || [])
  }
  async function submitSeries(e) {
    e.preventDefault()
    if (!seriesForm.title || !seriesForm.playlist_url) { toast.error('Title and playlist URL are required'); return }
    setSeriesSubmitting(true)
    const { error } = await supabase.from('sermon_series').insert({
      title: seriesForm.title, speaker: seriesForm.speaker || null,
      description: seriesForm.description || null, playlist_url: seriesForm.playlist_url,
      thumbnail_url: seriesForm.thumbnail_url || null, added_by: user.id,
    })
    setSeriesSubmitting(false)
    if (error) { toast.error(error.message); return }
    toast.success('📚 Series added!')
    setSeriesForm({ title:'', speaker:'', description:'', playlist_url:'', thumbnail_url:'' })
    loadSeriesList()
  }
  async function deleteSeries(id) {
    if (!confirm('Delete this series?')) return
    await supabase.from('sermon_series').delete().eq('id', id)
    toast.success('Deleted'); loadSeriesList()
  }

  async function loadAnnHistory() {
    const { data } = await supabase.from('whatsapp_broadcasts').select('*').order('created_at', { ascending: false }).limit(10)
    setAnnHistory(data || [])
  }
  async function sendAnnouncement(e) {
    e.preventDefault()
    if (!annForm.title || !annForm.message) { toast.error('Title and message required'); return }
    setAnnSending(true)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dekusdaschool.vercel.app'
    const [wa, email] = await Promise.all([
      fetch('/api/send-whatsapp', {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify(annForm),
      }).then(r => r.json()).catch(() => ({ error:'WhatsApp failed' })),
      fetch('/api/send-newsletter', {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify({ type:'announcement', title: annForm.title, summary: annForm.message, link: annForm.link || siteUrl }),
      }).then(r => r.json()).catch(() => ({ error:'Email failed' })),
    ])
    setAnnSending(false)
    const msgs = []
    msgs.push(wa.error ? `WhatsApp: ${wa.error}` : `WhatsApp: ${wa.sent ?? 0} sent`)
    msgs.push(email.error ? `Email: ${email.error}` : `Email: ${email.sent ?? 0} sent`)
    toast.success('📢 ' + msgs.join(' · '))
    if (!wa.error || !email.error) { setAnnForm({ title:'', message:'', link:'' }); loadAnnHistory() }
  }

  const filteredUsers = userTab === 'recent' ? users.slice(0, 20)
    : userTab === 'admins' ? users.filter(u => u.role === 'admin' || u.role === 'superadmin')
    : users

  if (!authReady) return null
  if (!user || !['admin', 'superadmin'].includes(profile?.role)) return null

  const NAV = [
    { key:'publications', icon:'📄', label:'Publications', badge: counts.pending > 0 ? counts.pending : null },
    { key:'devotionals',  icon:'📖', label:'Devotionals' },
    { key:'sermons',      icon:'🗂️', label:'Archives' },
    { key:'announcements',icon:'📢', label:'Announcements' },
    { key:'users',        icon:'👥', label:'Manage Users' },
  ]

  return (
    <>
      <Head><title>Admin Panel — In Light of the Word</title></Head>
      <Navbar user={user} profile={profile} />
      {previewPub && (
        <PreviewModal pub={previewPub} onClose={() => setPreviewPub(null)}
          onApprove={id => review(id, 'approved')} onReject={id => review(id, 'rejected')} />
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
                <div className={`font-display text-2xl font-bold ${t.key === 'pending' ? 'text-gold-400' : t.key === 'approved' ? 'text-green-400' : 'text-red-400'}`}>{counts[t.key] ?? '—'}</div>
                <div className="font-ui text-xs text-blue-300 uppercase tracking-wide">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-brand-800 border-b border-brand-700 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 min-w-max">
          {NAV.map(s => (
            <button key={s.key}
              onClick={() => {
                setSection(s.key)
                if (s.key === 'publications') loadPublications(pubTab)
                if (s.key === 'users')         loadUsers()
                if (s.key === 'devotionals')   loadDevotionals()
                if (s.key === 'sermons')       { loadSermons(); loadSeriesList() }
                if (s.key === 'announcements') loadAnnHistory()
              }}
              className={`flex items-center gap-2 px-4 py-3 font-ui text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${section === s.key ? 'border-white text-white' : 'border-transparent text-blue-300 hover:text-white'}`}>
              <span>{s.icon}</span> {s.label}
              {s.badge && <span className="bg-amber-400 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{s.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* PUBLICATIONS */}
        {section === 'publications' && (
          <>
            <div className="flex gap-2 mb-6 flex-wrap items-center">
              {PUB_TABS.map(t => (
                <button key={t.key} onClick={() => { setPubTab(t.key); loadPublications(t.key) }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-ui text-sm font-semibold transition-all ${pubTab === t.key ? 'bg-brand-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'}`}>
                  <span className={`w-2 h-2 rounded-full ${t.dot}`} /> {t.label}
                  {counts[t.key] > 0 && <span className={`text-xs font-bold ${pubTab === t.key ? 'text-blue-200' : 'text-slate-400'}`}>{counts[t.key]}</span>}
                </button>
              ))}
              <button onClick={() => loadPublications(pubTab)} className="ml-auto p-2 text-slate-400 hover:text-brand-600 transition-colors"><HiRefresh size={18} /></button>
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
                        {['Title','Author','Category','Date','Status','Media','Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-ui text-xs font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pubs.map(pub => {
                        const authorName = pub.profiles?.full_name || pub.author_name || 'Guest'
                        const date = new Date(pub.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'2-digit' })
                        return (
                          <tr key={pub.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3"><div className="font-ui font-semibold text-sm text-slate-800 max-w-[180px] truncate">{pub.title}</div>{pub.summary && <div className="font-ui text-xs text-slate-400 truncate max-w-[180px]">{pub.summary}</div>}</td>
                            <td className="px-4 py-3"><div className="font-ui text-sm text-slate-700 font-medium">{authorName}</div>{pub.author_email && <div className="font-ui text-xs text-slate-400">{pub.author_email}</div>}</td>
                            <td className="px-4 py-3"><span className="font-ui text-xs font-semibold capitalize bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">{pub.category === 'study' ? 'Bible Study' : pub.category}</span></td>
                            <td className="px-4 py-3 font-ui text-xs text-slate-500 whitespace-nowrap">{date}</td>
                            <td className="px-4 py-3"><span className={`font-ui text-xs font-bold px-2.5 py-1 rounded-full border badge-${pub.status}`}>{pub.status}</span></td>
                            <td className="px-4 py-3"><div className="flex gap-1 text-base">{pub.pdf_url && <span title="PDF">📄</span>}{pub.youtube_url && <span title="Video">▶️</span>}{pub.cover_image_url && <span title="Cover">🖼️</span>}</div></td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button onClick={() => setPreviewPub(pub)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Preview"><HiEye size={15} /></button>
                                <button onClick={() => startEditPub(pub)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit full publication"><HiPencil size={15} /></button>
                                {pub.status !== 'approved' && <button onClick={() => review(pub.id, 'approved')} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve"><HiCheckCircle size={15} /></button>}
                                {pub.status !== 'rejected' && <button onClick={() => review(pub.id, 'rejected')} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Reject"><HiXCircle size={15} /></button>}
                                <button onClick={() => deletePub(pub.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><HiTrash size={15} /></button>
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

        {/* DEVOTIONALS */}
        {section === 'devotionals' && (
          <div className="max-w-2xl">
            <h2 className="font-display text-xl font-bold text-slate-800 mb-6">📖 Daily Devotional</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
              <h3 className="font-ui font-bold text-slate-700 mb-4 flex items-center gap-2"><HiPlusCircle size={16} className="text-purple-500" /> Post Today's Devotional</h3>
              <form onSubmit={submitDevotional} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Title *</label>
                    <input value={devotForm.title} onChange={e => setDevotForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Walking in Faith" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-purple-400" />
                  </div>
                  <div>
                    <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Publish Date</label>
                    <input type="date" value={devotForm.published_date} onChange={e => setDevotForm(p => ({ ...p, published_date: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-purple-400" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Scripture verse</label>
                    <input value={devotForm.verse} onChange={e => setDevotForm(p => ({ ...p, verse: e.target.value }))} placeholder="e.g. For God so loved the world…" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-purple-400" />
                  </div>
                  <div>
                    <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Reference</label>
                    <input value={devotForm.verse_reference} onChange={e => setDevotForm(p => ({ ...p, verse_reference: e.target.value }))} placeholder="e.g. John 3:16" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-purple-400" />
                  </div>
                </div>
                <div>
                  <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Devotional paragraph *</label>
                  <DevotionalEditor value={devotForm.content} onChange={v => setDevotForm(p => ({ ...p, content: v }))} />
                </div>
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={devotSubmitting} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-ui text-sm font-semibold transition-all disabled:opacity-60">
                    <HiBookOpen size={15} /> {devotSubmitting ? 'Posting…' : 'Post Devotional'}
                  </button>
                  <span className="font-ui text-xs text-slate-400 flex items-center gap-1"><HiMail size={13} /> Emails all members</span>
                </div>
              </form>
            </div>
            <h3 className="font-ui font-bold text-slate-600 mb-3 text-sm uppercase tracking-wide">Recent Devotionals</h3>
            {devotLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
            ) : devotionals.length === 0 ? (
              <p className="text-center py-10 text-slate-400 font-ui text-sm">No devotionals posted yet.</p>
            ) : (
              <div className="space-y-2">
                {devotionals.map(d => (
                  <div key={d.id} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-ui font-semibold text-sm text-slate-800 truncate">{d.title}</div>
                      <div className="font-ui text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <HiCalendar size={11} /> {d.published_date}
                        {d.verse_reference && <span>· {d.verse_reference}</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteDevotional(d.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"><HiTrash size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SERMONS */}
        {section === 'sermons' && (
          <div className="max-w-2xl">
            <h2 className="font-display text-xl font-bold text-slate-800 mb-5">🗂️ Archives</h2>
            {/* Sub-tabs */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setSermonSubTab('sermons')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-ui text-sm font-semibold transition-all ${sermonSubTab === 'sermons' ? 'bg-red-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-red-300'}`}>
                🎙️ Sermons
              </button>
              <button onClick={() => { setSermonSubTab('series'); loadSeriesList() }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-ui text-sm font-semibold transition-all ${sermonSubTab === 'series' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                📚 Series
              </button>
            </div>

            {/* ---- SERMONS sub-tab ---- */}
            {sermonSubTab === 'sermons' && (<>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
              <h3 className="font-ui font-bold text-slate-700 mb-4 flex items-center gap-2"><HiPlusCircle size={16} className="text-red-500" /> Add a Sermon</h3>
              <form onSubmit={submitSermon} className="space-y-4">
                <div>
                  <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Sermon Title *</label>
                  <input value={sermonForm.title} onChange={e => setSermonForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. The Righteousness of Christ" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-red-400" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Speaker</label>
                    <input value={sermonForm.speaker} onChange={e => setSermonForm(p => ({ ...p, speaker: e.target.value }))} placeholder="Pastor / Elder name" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-red-400" />
                  </div>
                  <div>
                    <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Sabbath Date</label>
                    <input type="date" value={sermonForm.sermon_date} onChange={e => setSermonForm(p => ({ ...p, sermon_date: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-red-400" />
                  </div>
                </div>
                <div>
                  <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">YouTube Link *</label>
                  <input type="url" value={sermonForm.youtube_url} onChange={e => setSermonForm(p => ({ ...p, youtube_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=…" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-red-400" />
                </div>
                <div>
                  <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Description (optional)</label>
                  <textarea value={sermonForm.description} onChange={e => setSermonForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description or scripture references…" rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-red-400 resize-none" />
                </div>
                <button type="submit" disabled={sermonSubmitting} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-ui text-sm font-semibold transition-all disabled:opacity-60">
                  <HiVideoCamera size={15} /> {sermonSubmitting ? 'Adding…' : 'Add Sermon'}
                </button>
              </form>
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-ui font-bold text-slate-600 text-sm uppercase tracking-wide">Archived Sermons</h3>
              <Link href="/archives" target="_blank" className="font-ui text-xs text-brand-600 hover:underline flex items-center gap-1"><HiExternalLink size={12} /> View public page</Link>
            </div>
            {sermonLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
            ) : sermons.length === 0 ? (
              <p className="text-center py-10 text-slate-400 font-ui text-sm">No sermons added yet.</p>
            ) : (
              <div className="space-y-2">
                {sermons.map(s => {
                  const ytId = s.youtube_url ? getYouTubeId(s.youtube_url) : null
                  return (
                    <div key={s.id} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
                      {ytId && <img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-ui font-semibold text-sm text-slate-800 truncate">{s.title}</div>
                        <div className="font-ui text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          {s.speaker && <span className="flex items-center gap-1"><HiChat size={10} />{s.speaker}</span>}
                          {s.sermon_date && <span className="flex items-center gap-1"><HiCalendar size={10} />{s.sermon_date}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <a href={s.youtube_url} target="_blank" rel="noopener" className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><HiExternalLink size={14} /></a>
                        <button onClick={() => deleteSermon(s.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><HiTrash size={14} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            </>)}

            {/* ---- SERIES sub-tab ---- */}
            {sermonSubTab === 'series' && (<>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
                <h3 className="font-ui font-bold text-slate-700 mb-4 flex items-center gap-2"><HiPlusCircle size={16} className="text-indigo-500" /> Add a Series</h3>
                <form onSubmit={submitSeries} className="space-y-4">
                  <div>
                    <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Series Title *</label>
                    <input value={seriesForm.title} onChange={e => setSeriesForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. The Great Controversy Series" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-indigo-400" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Speaker</label>
                      <input value={seriesForm.speaker} onChange={e => setSeriesForm(p => ({ ...p, speaker: e.target.value }))}
                        placeholder="Pastor / Elder name" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-indigo-400" />
                    </div>
                    <div>
                      <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">YouTube Playlist URL *</label>
                      <input type="url" value={seriesForm.playlist_url} onChange={e => setSeriesForm(p => ({ ...p, playlist_url: e.target.value }))}
                        placeholder="https://www.youtube.com/playlist?list=…" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-indigo-400" />
                    </div>
                  </div>
                  <div>
                    <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Description (optional)</label>
                    <textarea value={seriesForm.description} onChange={e => setSeriesForm(p => ({ ...p, description: e.target.value }))}
                      rows={2} placeholder="Brief overview of the series…" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-indigo-400 resize-none" />
                  </div>
                  <button type="submit" disabled={seriesSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-ui text-sm font-semibold transition-all disabled:opacity-60">
                    📚 {seriesSubmitting ? 'Adding…' : 'Add Series'}
                  </button>
                </form>
              </div>
              <h3 className="font-ui font-bold text-slate-600 mb-3 text-sm uppercase tracking-wide">All Series</h3>
              {seriesList.length === 0 ? (
                <p className="text-center py-10 text-slate-400 font-ui text-sm">No series added yet.</p>
              ) : (
                <div className="space-y-2">
                  {seriesList.map(s => (
                    <div key={s.id} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 text-lg">📚</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-ui font-semibold text-sm text-slate-800 truncate">{s.title}</div>
                        <div className="font-ui text-xs text-slate-400 truncate mt-0.5">{s.speaker && `${s.speaker} · `}{s.description || s.playlist_url}</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <a href={s.playlist_url} target="_blank" rel="noopener" className="p-1.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"><HiExternalLink size={14} /></a>
                        <button onClick={() => deleteSeries(s.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><HiTrash size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>)}
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {section === 'announcements' && (
          <div className="max-w-2xl">
            <h2 className="font-display text-xl font-bold text-slate-800 mb-2">📢 Send Announcement</h2>
            <p className="font-ui text-sm text-slate-500 mb-6">Posts to WhatsApp subscribers and emails all members simultaneously.</p>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
              <form onSubmit={sendAnnouncement} className="space-y-4">
                <div>
                  <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Announcement Title *</label>
                  <input value={annForm.title} onChange={e => setAnnForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Sabbath Service This Saturday" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Message *</label>
                  <textarea value={annForm.message} onChange={e => setAnnForm(p => ({ ...p, message: e.target.value }))} placeholder="Write your announcement…" rows={4} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-green-400 resize-none" />
                </div>
                <div>
                  <label className="font-ui text-xs font-semibold text-slate-500 mb-1 block">Link (optional)</label>
                  <input type="url" value={annForm.link} onChange={e => setAnnForm(p => ({ ...p, link: e.target.value }))} placeholder="https://…" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm outline-none focus:border-green-400" />
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <button type="submit" disabled={annSending} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-ui text-sm font-semibold transition-all disabled:opacity-60">
                    <HiSpeakerphone size={15} /> {annSending ? 'Sending…' : 'Send to All'}
                  </button>
                  <div className="flex items-center gap-3 text-xs font-ui text-slate-400">
                    <span>📱 WhatsApp</span>
                    <span className="flex items-center gap-1"><HiMail size={13} className="text-blue-500" /> Email</span>
                  </div>
                </div>
              </form>
            </div>
            <h3 className="font-ui font-bold text-slate-600 mb-3 text-sm uppercase tracking-wide">Recent Broadcasts</h3>
            {annHistory.length === 0 ? (
              <p className="text-center py-8 text-slate-400 font-ui text-sm">No announcements sent yet.</p>
            ) : (
              <div className="space-y-2">
                {annHistory.map(a => (
                  <div key={a.id} className="bg-white border border-slate-100 rounded-xl px-4 py-3">
                    <div className="font-ui font-semibold text-sm text-slate-800">{a.title}</div>
                    <div className="font-ui text-xs text-slate-400 flex items-center gap-3 mt-1">
                      <span><HiCalendar size={10} className="inline mr-1" />{new Date(a.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'2-digit' })}</span>
                      <span className="text-green-600">✓ {a.sent_count} sent</span>
                      {a.failed_count > 0 && <span className="text-red-400">✗ {a.failed_count} failed</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <p className="font-ui text-sm font-semibold text-amber-800 mb-1">⚙️ WhatsApp Setup Required</p>
              <p className="font-ui text-xs text-amber-700 leading-relaxed">
                Set <code className="bg-amber-100 px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> and <code className="bg-amber-100 px-1 rounded">WHATSAPP_ACCESS_TOKEN</code> in
                Vercel → Settings → Environment Variables. Add subscriber phone numbers to the <code className="bg-amber-100 px-1 rounded">whatsapp_subscribers</code> table in Supabase.
                Email works automatically via the existing Gmail setup.
              </p>
            </div>
          </div>
        )}

        {/* USERS */}
        {section === 'users' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-slate-800">Users <span className="text-slate-400 font-normal text-base">({users.length})</span></h2>
              <button onClick={loadUsers} className="p-2 text-slate-400 hover:text-brand-600 transition-colors"><HiRefresh size={18} /></button>
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
            {userLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16"><div className="text-4xl mb-3">👤</div><h3 className="font-display text-lg font-bold text-slate-500">No users in this view</h3></div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      {['User','Email','Joined','Role','Change Role'].map(h => (
                        <th key={h} className="text-left px-5 py-3 font-ui text-xs font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => {
                      const joinedDate = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'2-digit' }) : '—'
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
                              {u.role !== 'admin' && u.role !== 'superadmin' && <button onClick={() => changeRole(u.id, 'admin')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-ui text-xs font-semibold transition-colors"><HiBadgeCheck size={14} /> Make Admin</button>}
                              {u.role === 'admin' && u.id !== user?.id && <button onClick={() => changeRole(u.id, 'member')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg font-ui text-xs font-semibold transition-colors">Remove Admin</button>}
                              {profile?.role === 'superadmin' && u.role !== 'superadmin' && <button onClick={() => changeRole(u.id, 'superadmin')} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-ui text-xs font-semibold transition-colors">Make Superadmin</button>}
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
