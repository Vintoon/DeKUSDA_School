import { useEffect } from 'react'
import Image from 'next/image'
import { HiX, HiDownload, HiExternalLink, HiCalendar } from 'react-icons/hi'
import { getYouTubeId } from '../lib/supabase'

const CATEGORIES = {
  sermon: 'bg-blue-100 text-blue-700',
  devotional: 'bg-purple-100 text-purple-700',
  testimony: 'bg-green-100 text-green-700',
  study: 'bg-amber-100 text-amber-700',
  news: 'bg-rose-100 text-rose-700',
  general: 'bg-slate-100 text-slate-700',
}

export default function ArticleModal({ pub, onClose }) {
  const authorName = pub.profiles?.full_name || pub.author_name || 'Anonymous'
  const initials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  const dateStr = new Date(pub.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const ytId = pub.youtube_url ? getYouTubeId(pub.youtube_url) : null

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center p-4 sm:p-8 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl modal-enter my-4">
        {/* Cover */}
        {pub.cover_image_url && (
          <div className="relative h-64 rounded-t-2xl overflow-hidden">
            <Image src={pub.cover_image_url} alt={pub.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 relative">
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors">
            <HiX size={16} />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-ui font-bold px-2.5 py-0.5 rounded-full ${CATEGORIES[pub.category] || CATEGORIES.general}`}>
              {pub.category}
            </span>
            {pub.featured && <span className="bg-gold-400 text-white text-xs font-ui font-bold px-2.5 py-0.5 rounded-full">★ Featured</span>}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-4">
            {pub.title}
          </h1>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">
                {initials}
              </div>
              <div>
                <div className="font-ui font-semibold text-sm text-slate-800">{authorName}</div>
                <div className="font-ui text-xs text-slate-400 flex items-center gap-1"><HiCalendar size={11} /> {dateStr}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="ml-auto flex gap-2">
              {pub.allow_download && pub.pdf_url && (
                <a href={pub.pdf_url} download target="_blank" rel="noopener"
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-ui text-sm font-semibold transition-all shadow-sm">
                  <HiDownload size={16} /> Download PDF
                </a>
              )}
              {pub.pdf_url && (
                <a href={pub.pdf_url} target="_blank" rel="noopener"
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-ui text-sm font-semibold transition-all">
                  <HiExternalLink size={16} /> View PDF
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          {/* Summary */}
          {pub.summary && (
            <p className="font-body text-lg text-slate-600 italic leading-relaxed mb-6 pb-6 border-b border-slate-100">
              {pub.summary}
            </p>
          )}

          {/* Article images */}
          {pub.publication_images?.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {pub.publication_images.map(img => (
                <div key={img.id} className="relative rounded-lg overflow-hidden aspect-video">
                  <Image src={img.url} alt={img.caption || ''} fill className="object-cover" />
                  {img.caption && <p className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs p-1.5 font-ui">{img.caption}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          {pub.content && (
            <div className="font-body text-slate-700 text-lg leading-loose space-y-4 mb-8">
              {pub.content.split('\n').filter(p => p.trim()).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          {/* YouTube embed */}
          {ytId && (
            <div className="mt-6">
              <h3 className="font-display text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-600 rounded flex items-center justify-center text-white text-xs">▶</span>
                Attached Video
              </h3>
              <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden bg-black">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title="YouTube video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* PDF viewer hint */}
          {pub.pdf_url && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-4">
              <div className="text-3xl">📄</div>
              <div className="flex-1">
                <div className="font-ui font-semibold text-sm text-slate-800">{pub.pdf_filename || 'Attached Document'}</div>
                <div className="font-ui text-xs text-slate-500">PDF document attached to this publication</div>
              </div>
              <div className="flex gap-2">
                <a href={pub.pdf_url} target="_blank" rel="noopener"
                  className="px-3 py-1.5 bg-brand-600 text-white rounded-lg font-ui text-xs font-semibold">View</a>
                {pub.allow_download && (
                  <a href={pub.pdf_url} download
                    className="px-3 py-1.5 bg-white border border-brand-200 text-brand-700 rounded-lg font-ui text-xs font-semibold">Download</a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
