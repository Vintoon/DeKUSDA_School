import Image from 'next/image'
import Link from 'next/link'
import { HiPlay, HiBookOpen, HiHeart, HiChat, HiCalendar } from 'react-icons/hi'
import { getYouTubeThumbnail } from '../lib/supabase'

const CATEGORIES = {
  sermon:     { label:'Sermon',      color:'bg-blue-100 text-blue-700' },
  devotional: { label:'Devotional',  color:'bg-purple-100 text-purple-700' },
  testimony:  { label:'Testimony',   color:'bg-green-100 text-green-700' },
  study:      { label:'Bible Study', color:'bg-amber-100 text-amber-700' },
  news:       { label:'Church News', color:'bg-rose-100 text-rose-700' },
  general:    { label:'General',     color:'bg-slate-100 text-slate-700' },
}

export default function PublicationCard({ pub }) {
  const cat        = CATEGORIES[pub.category] || CATEGORIES.general
  const dateStr    = new Date(pub.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
  const authorName = pub.profiles?.full_name || pub.author_name || 'Anonymous'
  const initials   = authorName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()
  const ytThumb    = pub.youtube_url ? getYouTubeThumbnail(pub.youtube_url) : null

  return (
    <article className="pub-card bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col w-full">

      {/* Thumbnail — full width, proportional height */}
      <Link href={`/publication/${pub.id}`}
        className="block relative w-full h-44 sm:h-48 bg-gradient-to-br from-brand-800 to-brand-600 overflow-hidden flex-shrink-0">
        {pub.cover_image_url ? (
          <Image
            src={pub.cover_image_url}
            alt={pub.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
          />
        ) : ytThumb ? (
          <>
            <Image src={ytThumb} alt={pub.title} fill className="object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                <HiPlay className="text-brand-700 ml-0.5" size={22} />
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <img src="/logo.png" alt="" className="w-20 h-20 object-contain" />
          </div>
        )}

        {pub.featured && (
          <div className="absolute top-2 left-2 bg-gold-400 text-white text-xs font-ui font-bold px-2 py-0.5 rounded-full shadow-sm">
            ★ Featured
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          {pub.pdf_url     && <span className="bg-white/90 text-slate-700 text-xs font-ui font-bold px-2 py-0.5 rounded-full">📄</span>}
          {pub.youtube_url && <span className="bg-red-600/90 text-white text-xs font-ui font-bold px-2 py-0.5 rounded-full">▶</span>}
        </div>
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">

        {/* Category + date */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-ui font-bold px-2 py-0.5 rounded-full ${cat.color}`}>
            {cat.label}
          </span>
          <span className="flex items-center gap-1 text-xs font-ui text-slate-400">
            <HiCalendar size={11} /> {dateStr}
          </span>
        </div>

        {/* Title */}
        <Link href={`/publication/${pub.id}`}>
          <h3 className="font-display text-base font-bold text-slate-900 leading-snug mb-2 line-clamp-2 hover:text-brand-700 transition-colors">
            {pub.title}
          </h3>
        </Link>

        {/* Summary */}
        {pub.summary && (
          <p className="font-body text-slate-500 text-sm leading-relaxed line-clamp-2 mb-3 flex-1">
            {pub.summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <span className="font-ui text-xs text-slate-600 font-medium truncate max-w-[100px]">
              {authorName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-400">
              {pub.like_count > 0 && (
                <span className="flex items-center gap-0.5 text-xs font-ui">
                  <HiHeart size={12} className="text-red-400" /> {pub.like_count}
                </span>
              )}
              {pub.comment_count > 0 && (
                <span className="flex items-center gap-0.5 text-xs font-ui">
                  <HiChat size={12} /> {pub.comment_count}
                </span>
              )}
            </div>
            <Link
              href={`/publication/${pub.id}`}
              className="flex items-center gap-1 px-3 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg font-ui text-xs font-semibold transition-colors min-h-[36px]">
              <HiBookOpen size={13} /> Read
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
