import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
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
  news:'bg-rose-100 text-rose-700', general:'bg-slate-100 text-slate-700',
}

export default function PublicationPage({ user, profile }) {
  const router = useRouter()
  const { id } = router.query
  const [pub, setPub]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [related, setRelated]   = useState([])
  const [comments, setComments] = useState([])
  const [liked, setLiked]       = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentLoading, setCommentLoading] = useState(false)
  const [newComment, setNewComment] = useState({ name:'', email:'', body:'' })
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => { if (id) fetchAll() }, [id])

  async function fetchAll() {
    setLoading(true)
    const { data, error } = await supabase
      .from('publications')
      .select('*, profiles!author_id(full_name), publication_images(*)')
      .eq('id', id)
      .eq('status', 'approved')
      .single()

    if (error || !data) { router.push('/'); return }
    setPub(data)
    setLikeCount(data.like_count || 0)
    setLoading(false)

    supabase.from('publications').update({ views: (data.views||0)+1 }).eq('id', id).then(()=>{})

    // Load related
    const { data: rel } = await supabase
      .from('publications')
      .select('id,title,category,cover_image_url,author_name,profiles!author_id(full_name),created_at')
      .eq('status','approved')
      .eq('category', data.category)
      .neq('id', id)
      .limit(3)
    setRelated(rel || [])

    // Load comments
    fetchComments()

    // Check if user already liked
    checkLiked()
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('publication_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function checkLiked() {
    if (!user) {
      // Use localStorage for anon like tracking
      const likedPubs = JSON.parse(localStorage.getItem('likedPubs') || '[]')
      setLiked(likedPubs.includes(id))
      return
    }
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('publication_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    setLiked(!!data)
  }

  async function handleLike() {
    if (liked) {
      // Unlike
      if (user) {
        await supabase.from('likes').delete().eq('publication_id', id).eq('user_id', user.id)
      } else {
        const likedPubs = JSON.parse(localStorage.getItem('likedPubs') || '[]')
        localStorage.setItem('likedPubs', JSON.stringify(likedPubs.filter(p => p !== id)))
      }
      setLiked(false)
      setLikeCount(c => Math.max(0, c-1))
    } else {
      // Like
      if (user) {
        const { error } = await supabase.from('likes').insert({ publication_id: id, user_id: user.id })
        if (error) { toast.error('Could not like'); return }
      } else {
        const anonKey = `anon_${Math.random().toString(36).slice(2)}_${Date.now()}`
        const { error } = await supabase.from('likes').insert({ publication_id: id, anon_key: anonKey })
        if (error && error.code !== '23505') { toast.error('Could not like'); return }
        const likedPubs = JSON.parse(localStorage.getItem('likedPubs') || '[]')
        localStorage.setItem('likedPubs', JSON.stringify([...likedPubs, id]))
      }
      setLiked(true)
      setLikeCount(c => c+1)
    }
  }

  async function handleComment(e) {
    e.preventDefault()
    const name = user ? (profile?.full_name || user.email.split('@')[0]) : newComment.name.trim()
    const email = user ? user.email : newComment.email.trim()
    const body = newComment.body.trim()

    if (!name) { toast.error('Please enter your name'); return }
    if (!body) { toast.error('Please write a comment'); return }

    setSubmittingComment(true)
    const { error } = await supabase.from('comments').insert({
      publication_id: id,
      author_id: user?.id || null,
      author_name: name,
      author_email: email || null,
      body,
      status: 'approved',
    })
    setSubmittingComment(false)

    if (error) { toast.error(error.message); return }
    toast.success('Comment posted! 🙏')
    setNewComment({ name:'', email:'', body:'' })
    fetchComments()
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: pub.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  if (loading) return (
    <>
      <Navbar user={user} profile={profile} />
      <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-6" />
        <div className="h-56 bg-slate-200 rounded-2xl mb-6" />
        <div className="space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="h-4 bg-slate-100 rounded" style={{width:`${90-i*8}%`}} />)}</div>
      </div>
    </>
  )
  if (!pub) return null

  const authorName = pub.profiles?.full_name || pub.author_name || 'Anonymous'
  const initials = authorName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()
  const dateStr = new Date(pub.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})
  const ytId = pub.youtube_url ? getYouTubeId(pub.youtube_url) : null

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
          {/* Cover */}
          {pub.cover_image_url && (
            <div className="relative h-64 sm:h-80 w-full">
              <Image src={pub.cover_image_url} alt={pub.title} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          )}

          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-xs font-ui font-bold px-3 py-1 rounded-full capitalize ${CAT_COLORS[pub.category]||CAT_COLORS.general}`}>
                {pub.category==='study'?'Bible Study':pub.category}
              </span>
              {pub.featured && <span className="text-xs font-ui font-bold px-3 py-1 rounded-full bg-gold-400 text-white">★ Featured</span>}
              {pub.pdf_url && <span className="text-xs font-ui font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">📄 PDF</span>}
              {ytId && <span className="text-xs font-ui font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">▶ Video</span>}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-5">{pub.title}</h1>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">{initials}</div>
                <div>
                  <div className="font-ui font-semibold text-sm text-slate-800">{authorName}</div>
                  <div className="font-ui text-xs text-slate-400 flex items-center gap-1">
                    <HiCalendar size={11} /> {dateStr}
                    {pub.views>0 && <span className="ml-2">· {pub.views} views</span>}
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

          {/* Body */}
          <div className="p-6 sm:p-8">
            {pub.summary && (
              <p className="font-body text-xl text-slate-600 italic leading-relaxed mb-7 pb-7 border-b border-slate-100">{pub.summary}</p>
            )}

            {/* Inline images */}
            {pub.publication_images?.length > 0 && (
              <div className={`grid gap-3 mb-7 ${pub.publication_images.length===1?'grid-cols-1':'grid-cols-2'}`}>
                {pub.publication_images.map(img=>(
                  <figure key={img.id} className="rounded-xl overflow-hidden">
                    <div className="relative aspect-video bg-slate-100">
                      <Image src={img.url} alt={img.caption||''} fill className="object-cover" />
                    </div>
                    {img.caption && <figcaption className="text-xs font-ui text-slate-500 text-center py-1.5 bg-slate-50 px-3">{img.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            )}

            {/* Content */}
            {pub.content && (
              <div className="mb-8">
                {pub.content.split('\n').filter(p=>p.trim()).map((para,i)=>(
                  <p key={i} className="font-body text-lg text-slate-700 leading-loose mb-4">{para}</p>
                ))}
              </div>
            )}

            {/* YouTube */}
            {ytId && (
              <div className="mt-6 mb-8">
                <h3 className="font-display text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs">▶</span>
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
              <div className="mt-4 mb-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-4 flex-wrap">
                <div className="text-3xl">📄</div>
                <div className="flex-1 min-w-0">
                  <div className="font-ui font-bold text-sm text-slate-800">{pub.pdf_filename||'Attached Document'}</div>
                  <div className="font-ui text-xs text-slate-500">PDF document attached</div>
                </div>
                <div className="flex gap-2">
                  <a href={pub.pdf_url} target="_blank" rel="noopener" className="px-3 py-1.5 bg-brand-600 text-white rounded-xl font-ui text-xs font-semibold">View</a>
                  {pub.allow_download && <a href={pub.pdf_url} download className="px-3 py-1.5 bg-white border border-brand-200 text-brand-700 rounded-xl font-ui text-xs font-semibold flex items-center gap-1"><HiDownload size={13}/>Download</a>}
                </div>
              </div>
            )}

            {/* ── LIKE BUTTON ── */}
            <div className="flex items-center gap-4 py-5 border-t border-b border-slate-100 mb-8">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-ui font-bold text-sm transition-all ${
                  liked
                    ? 'bg-red-500 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500'
                }`}>
                <HiHeart size={18} className={liked ? 'fill-white' : ''} />
                {liked ? 'Liked' : 'Like'} · {likeCount}
              </button>
              <div className="flex items-center gap-1.5 text-slate-400 font-ui text-sm">
                <HiChat size={18} /> {comments.length} {comments.length===1?'comment':'comments'}
              </div>
            </div>

            {/* ── COMMENTS ── */}
            <div>
              <h3 className="font-display text-xl font-bold text-slate-800 mb-5">
                Comments ({comments.length})
              </h3>

              {/* Existing comments */}
              {comments.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl mb-6">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="font-ui text-sm text-slate-400">No comments yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {comments.map(c => {
                    const cInitials = c.author_name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()
                    const cDate = new Date(c.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
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

              {/* Comment form */}
              <div className="bg-slate-50 rounded-2xl p-5">
                <h4 className="font-ui font-bold text-sm text-slate-700 mb-4">Leave a Comment</h4>
                <form onSubmit={handleComment} className="space-y-3">
                  {!user && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input value={newComment.name} onChange={e=>setNewComment(p=>({...p,name:e.target.value}))}
                        placeholder="Your name *" required
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm bg-white outline-none focus:border-brand-400" />
                      <input type="email" value={newComment.email} onChange={e=>setNewComment(p=>({...p,email:e.target.value}))}
                        placeholder="Email (optional)"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-ui text-sm bg-white outline-none focus:border-brand-400" />
                    </div>
                  )}
                  {user && (
                    <div className="flex items-center gap-2 text-sm font-ui text-slate-500 bg-white rounded-xl px-3 py-2 border border-slate-200">
                      <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                        {(profile?.full_name||'U').charAt(0).toUpperCase()}
                      </div>
                      Commenting as <strong className="text-slate-800">{profile?.full_name || user.email.split('@')[0]}</strong>
                    </div>
                  )}
                  <textarea
                    value={newComment.body} onChange={e=>setNewComment(p=>({...p,body:e.target.value}))}
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

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-5">
              More {pub.category==='study'?'Bible Studies':pub.category.charAt(0).toUpperCase()+pub.category.slice(1)+'s'}
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map(r=>(
                <Link key={r.id} href={`/publication/${r.id}`}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="relative h-32 bg-gradient-to-br from-brand-700 to-brand-900">
                    {r.cover_image_url && <Image src={r.cover_image_url} alt={r.title} fill className="object-cover opacity-80" />}
                  </div>
                  <div className="p-3">
                    <h3 className="font-display font-bold text-slate-800 text-sm line-clamp-2 leading-snug">{r.title}</h3>
                    <p className="font-ui text-xs text-slate-400 mt-1">{r.profiles?.full_name||r.author_name||'Anonymous'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="hero-pattern text-white mt-12 py-6 text-center">
        <p className="font-ui text-sm text-blue-300">
          © {new Date().getFullYear()} Three Angels Publications Ministry &nbsp;·&nbsp;
          <Link href="/" className="hover:text-white">Back to Publications</Link>
        </p>
      </footer>
    </>
  )
}
