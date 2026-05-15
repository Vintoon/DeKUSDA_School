import { useState, useEffect } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import { supabase, getYouTubeId } from '../../lib/supabase'
import { HiDownload, HiExternalLink, HiCalendar, HiArrowLeft, HiShare, HiHeart, HiChat, HiPaperAirplane } from 'react-icons/hi'
import toast from 'react-hot-toast'

const CAT_COLORS = {
  sermon:'bg-blue-100 text-blue-700', devotional:'bg-purple-100 text-purple-700',
  testimony:'bg-green-100 text-green-700', study:'bg-amber-100 text-amber-700',
  news:'bg-rose-100 text-rose-700', about:'bg-sky-100 text-sky-700',
  Health:'bg-emerald-100 text-emerald-700', review:'bg-violet-100 text-violet-700',
  general:'bg-slate-100 text-slate-700',
}

export default function PublicationPage({ user, profile, pub, related: initialRelated, error: serverError }) {
  const [comments, setComments]           = useState([])
  const [liked, setLiked]                 = useState(false)
  const [likeCount, setLikeCount]         = useState(pub?.like_count || 0)
  const [newComment, setNewComment]       = useState({ name:'', email:'', body:'' })
  const [submittingComment, setSubmittingComment] = useState(false)
  const related = initialRelated || []

  // Hooks must come before any early return (Rules of Hooks)
  useEffect(() => {
    if (!pub) return
    fetchComments()
    checkLiked()
    // Increment view count — fire and forget, ignore errors
    ;(async () => {
      const { error } = await supabase.rpc('increment_views', { pub_id: pub.id })
      if (error) {
        // Fallback if RPC doesn't exist
        await supabase.from('publications').update({ views: (pub.views || 0) + 1 }).eq('id', pub.id)
      }
    })()
  }, [pub?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Functions declared before the early return so they are always defined
  // when the useEffect runs (avoids relying solely on JS hoisting).

  async function fetchComments() {
    if (!pub) return
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('publication_id', pub.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function checkLiked() {
    if (!pub) return
    if (user) {
      const { data } = await supabase
        .from('likes').select('id')
        .eq('publication_id', pub.id).eq('user_id', user.id).maybeSingle()
      setLiked(!!data)
    } else {
      try {
        const likedPubs = JSON.parse(localStorage.getItem('likedPubs') || '[]')
        setLiked(likedPubs.includes(pub.id))
      } catch {}
    }
  }

  async function handleLike() {
    if (!pub) return
    if (liked) {
      if (user) await supabase.from('likes').delete().eq('publication_id', pub.id).eq('user_id', user.id)
      else {
        try {
          const lp = JSON.parse(localStorage.getItem('likedPubs') || '[]')
          localStorage.setItem('likedPubs', JSON.stringify(lp.filter(p => p !== pub.id)))
        } catch {}
      }
      setLiked(false); setLikeCount(c => Math.max(0, c - 1))
    } else {
      if (user) {
        const { error } = await supabase.from('likes').insert({ publication_id: pub.id, user_id: user.id })
        if (error) { toast.error('Could not like'); return }
      } else {
        const anonKey = `anon_${Math.random().toString(36).slice(2)}_${Date.now()}`
        const { error } = await supabase.from('likes').insert({ publication_id: pub.id, anon_key: anonKey })
        if (error && error.code !== '23505') { toast.error('Could not like'); return }
        try {
          const lp = JSON.parse(localStorage.getItem('likedPubs') || '[]')
          localStorage.setItem('likedPubs', JSON.stringify([...lp, pub.id]))
        } catch {}
      }
      setLiked(true); setLikeCount(c => c + 1)
    }
  }

  async function handleComment(e) {
    e.preventDefault()
    if (!pub) return
    const name  = user ? (profile?.full_name || user.email.split('@')[0]) : newComment.name.trim()
    const email = user ? user.email : newComment.email.trim()
    const body  = newComment.body.trim()
    if (!name) { toast.error('Please enter your name'); return }
    if (!body) { toast.error('Please write a comment'); return }
    setSubmittingComment(true)
    const { error } = await supabase.from('comments').insert({
      publication_id: pub.id, author_id: user?.id || null,
      author_name: name, author_email: email || null, body, status: 'approved',
    })
    setSubmittingComment(false)
    if (error) { toast.error(error.message); return }
    toast.success('Comment posted! 🙏')
    setNewComment({ name:'', email:'', body:'' })
    fetchComments()
  }

  function handleShare() {
    if (!pub) return
    if (navigator.share) navigator.share({ title: pub.title, url: window.location.href })
    else { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }
  }

  // If server couldn't fetch the pub, show a friendly error
  if (serverError || !pub) {
    return (
      <>
        <Navbar user={user} profile={profile} />
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-5xl mb-4">📄</div>
            <h2 className="font-display text-2xl font-bold text-slate-700 mb-2">Publication not found</h2>
            <p className="font-ui text-slate-400 mb-6">It may have been removed or is pending review.</p>
            <Link href="/" className="px-6 py-3 bg-brand-600 text-white rounded-xl font-ui font-semibold text-sm hover:bg-brand-700 transition-colors">
              Back to Publications
            </Link>
          </div>
        </div>
      </>
    )
  }

  const authorName = pub.profiles?.full_name || pub.author_name || 'Anonymous'
  const initials   = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  const dateStr    = new Date(pub.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
  const ytId       = pub.youtube_url ? getYouTubeId(pub.youtube_url) : null

  return (
    <>
      <Head>
        <title>{pub.title} — Three Angels Publications</title>
        <meta name="description" content={pub.summary || pub.title} />
        {pub.cover_image_url && <meta property="og:image" content={pub.cover_image_url} />}
      </Head>
      <Navbar user={user} profile={profile} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-2 font-ui text-sm text-slate-500 hover:text-brand-600 mb-6 transition-colors">
          <HiArrowLeft size={15} /> Back to Publications
        </Link>

        <article className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {pub.cover_image_url && (
            <div className="relative h-64 sm:h-80 w-full">
              <Image src={pub.cover_image_url} alt={pub.title} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6 sm:p-8 border-b border-slate-100">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-xs font-ui font-bold px-3 py-1 rounded-full capitalize ${CAT_COLORS[pub.category] || CAT_COLORS.general}`}>
                {pub.category === 'study' ? 'Bible Study' : pub.category}
              </span>
              {pub.featured && <span className="text-xs font-ui font-bold px-3 py-1 rounded-full bg-gold-400 text-white">★ Featured</span>}
              {pub.pdf_url  && <span className="text-xs font-ui font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">📄 PDF</span>}
              {ytId         && <span className="text-xs font-ui font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">▶ Video</span>}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-5">{pub.title}</h1>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">{initials}</div>
                <div>
                  <div className="font-ui font-semibold text-sm text-slate-800">{authorName}</div>
                  <div className="font-ui text-xs text-slate-400 flex items-center gap-1">
                    <HiCalendar size={11} /> {dateStr}
                    {pub.views > 0 && <span className="ml-2">· {pub.views} views</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-ui text-xs font-semibold transition-all">
                  <HiShare size={14} /> Share
                </button>
                {pub.pdf_url && (
                  <a href={pub.pdf_url} target="_blank" rel="noopener"
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-ui text-xs font-semibold transition-all">
                    <HiExternalLink size={14} /> View PDF
                  </a>
                )}
                {pub.allow_download && pub.pdf_url && (
                  <a href={pub.pdf_url} download target="_blank" rel="noopener"
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-ui text-xs font-semibold transition-all shadow-sm">
                    <HiDownload size={14} /> Download PDF
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {pub.summary && (
              <p className="font-body text-xl text-slate-600 italic leading-relaxed mb-7 pb-7 border-b border-slate-100">{pub.summary}</p>
            )}

            {pub.publication_images?.length > 0 && (
              <div className={`grid gap-3 mb-7 ${pub.publication_images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
                className="mb-8 prose-content"
                dangerouslySetInnerHTML={{ __html: pub.content }}
              />
            )}

            {ytId && (
              <div className="mt-6 mb-8">
                <h3 className="font-display text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs">▶</span> Video
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
              <div className="mt-4 mb-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-4 flex-wrap">
                <div className="text-3xl">📄</div>
                <div className="flex-1 min-w-0">
                  <div className="font-ui font-bold text-sm text-slate-800">{pub.pdf_filename || 'Attached Document'}</div>
                  <div className="font-ui text-xs text-slate-500">PDF document attached</div>
                </div>
                <div className="flex gap-2">
                  <a href={pub.pdf_url} target="_blank" rel="noopener" className="px-3 py-1.5 bg-brand-600 text-white rounded-xl font-ui text-xs font-semibold">View</a>
                  {pub.allow_download && (
                    <a href={pub.pdf_url} download className="px-3 py-1.5 bg-white border border-brand-200 text-brand-700 rounded-xl font-ui text-xs font-semibold flex items-center gap-1">
                      <HiDownload size={13} /> Download
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Like button */}
            <div className="flex items-center gap-4 py-5 border-t border-b border-slate-100 mb-8">
              <button onClick={handleLike}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-ui font-bold text-sm transition-all ${
                  liked ? 'bg-red-500 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500'
                }`}>
                <HiHeart size={18} className={liked ? 'fill-white' : ''} />
                {liked ? 'Liked' : 'Like'} · {likeCount}
              </button>
              <div className="flex items-center gap-1.5 text-slate-400 font-ui text-sm">
                <HiChat size={18} /> {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </div>
            </div>

            {/* Comments */}
            <div>
              <h3 className="font-display text-xl font-bold text-slate-800 mb-5">Comments ({comments.length})</h3>

              {comments.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl mb-6">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="font-ui text-sm text-slate-400">No comments yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {comments.map(c => {
                    const cInitials = c.author_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    const cDate = new Date(c.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
                    return (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                          {cInitials}
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-ui font-bold text-sm text-slate-800">{c.author_name}</span>
                            <span className="font-ui text-xs text-slate-400">{cDate}</span>
                          </div>
                          <p className="font-body text-slate-700 text-base leading-relaxed">{c.body}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl p-5">
                <h4 className="font-ui font-bold text-sm text-slate-700 mb-4">Leave a Comment</h4>
                <form onSubmit={handleComment} className="space-y-3">
                  {!user && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input value={newComment.name} onChange={e => setNewComment(p => ({ ...p, name: e.target.value }))}
                        placeholder="Your name *" required
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm bg-white outline-none focus:border-brand-400" />
                      <input type="email" value={newComment.email} onChange={e => setNewComment(p => ({ ...p, email: e.target.value }))}
                        placeholder="Email (optional)"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm bg-white outline-none focus:border-brand-400" />
                    </div>
                  )}
                  {user && (
                    <div className="flex items-center gap-2 text-sm font-ui text-slate-500 bg-white rounded-xl px-3 py-2 border border-slate-200">
                      <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                        {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      Commenting as <strong className="text-slate-800">{profile?.full_name || user.email.split('@')[0]}</strong>
                    </div>
                  )}
                  <textarea value={newComment.body} onChange={e => setNewComment(p => ({ ...p, body: e.target.value }))}
                    placeholder="Write your comment…" required rows={3}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm bg-white outline-none focus:border-brand-400 resize-none" />
                  <button type="submit" disabled={submittingComment}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-ui text-sm font-semibold transition-all disabled:opacity-60">
                    <HiPaperAirplane size={15} /> {submittingComment ? 'Posting…' : 'Post Comment'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-5">
              More {pub.category === 'study' ? 'Bible Studies' : pub.category.charAt(0).toUpperCase() + pub.category.slice(1) + 's'}
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.id} href={`/publication/${r.id}`}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="relative h-32 bg-gradient-to-br from-brand-700 to-brand-900">
                    {r.cover_image_url && <Image src={r.cover_image_url} alt={r.title} fill className="object-cover opacity-80" />}
                  </div>
                  <div className="p-3">
                    <h3 className="font-display font-bold text-slate-800 text-sm line-clamp-2 leading-snug">{r.title}</h3>
                    <p className="font-ui text-xs text-slate-400 mt-1">{r.profiles?.full_name || r.author_name || 'Anonymous'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="hero-pattern text-white mt-12 py-6 text-center">
        <p className="font-ui text-sm text-blue-300">
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> Three Angels Publications Ministry &nbsp;·&nbsp;
          <Link href="/" className="hover:text-white">Back to Publications</Link>
        </p>
      </footer>
    </>
  )
}

// ─── SERVER-SIDE RENDERING ────────────────────────────────────────────────────
// Fetches the publication on Vercel's server before sending HTML to the browser.
// This means the full article text is in the HTML the moment it arrives on mobile
// — no waiting for JS to hydrate and fetch. Fixes the "can't read articles" issue.
// ─────────────────────────────────────────────────────────────────────────────
export async function getServerSideProps({ params }) {
  const { id } = params
  try {
    const { data: pub, error } = await supabase
      .from('publications')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .single()

    if (error || !pub) return { props: { pub: null, related: [], error: true } }

    const { data: related } = await supabase
      .from('publications')
      .select('id, title, category, cover_image_url, author_name, created_at')
      .eq('status', 'approved')
      .eq('category', pub.category)
      .neq('id', id)
      .limit(3)

    return {
      props: {
        pub,
        related: related || [],
        error: false,
      },
    }
  } catch (e) {
    console.error('getServerSideProps error:', e)
    return { props: { pub: null, related: [], error: true } }
  }
}
