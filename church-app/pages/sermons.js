import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { supabase, getYouTubeId } from '../lib/supabase'
import { HiSearch, HiCalendar, HiUser, HiPlay, HiChevronDown, HiChevronUp } from 'react-icons/hi'

export default function SermonsPage({ user, profile }) {
  const [sermons, setSermons]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchSermons() }, [])

  async function fetchSermons() {
    setLoading(true)
    const { data } = await supabase
      .from('sermons')
      .select('*')
      .order('sermon_date', { ascending: false })
    setSermons(data || [])
    setLoading(false)
  }

  const filtered = sermons.filter(s =>
    !search.trim() ||
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.speaker?.toLowerCase().includes(search.toLowerCase())
  )

  // Group by year
  const grouped = filtered.reduce((acc, s) => {
    const y = new Date(s.sermon_date || s.created_at).getFullYear()
    if (!acc[y]) acc[y] = []
    acc[y].push(s)
    return acc
  }, {})
  const years = Object.keys(grouped).sort((a, b) => b - a)

  return (
    <>
      <Head>
        <title>Sermon Archive — In Light of the Word</title>
        <meta name="description" content="Watch and listen to Sabbath sermons from In Light of the Word — archived with speaker, date, and video embed." />
        <meta property="og:title" content="Sermon Archive — In Light of the Word" />
        <meta property="og:description" content="Sabbath sermons, archived and freely available." />
        <meta property="og:site_name" content="In Light of the Word" />
      </Head>
      <Navbar user={user} profile={profile} />

      {/* Hero */}
      <div className="hero-pattern py-12 px-4 text-center">
        <div className="text-3xl mb-2">🎙️</div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-white mb-2">Sermon Archive</h1>
        <p className="font-ui text-blue-200 text-sm max-w-md mx-auto">
          Sabbath sermons — searchable, watchable, and freely shared to the glory of God.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Search */}
        <div className="relative mb-8">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or speaker…"
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl font-ui text-sm outline-none focus:border-brand-400 bg-white shadow-sm"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-ui text-slate-500">No sermons found.</p>
          </div>
        ) : (
          years.map(year => (
            <div key={year} className="mb-8">
              <h2 className="font-display text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">✞</span>
                {year}
              </h2>
              <div className="space-y-3">
                {grouped[year].map(s => (
                  <SermonCard
                    key={s.id}
                    sermon={s}
                    expanded={expanded === s.id}
                    onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <footer className="hero-pattern text-white py-6 text-center mt-4">
        <p className="font-ui text-sm text-blue-300">
          © {new Date().getFullYear()} In Light of the Word &nbsp;·&nbsp;
          <Link href="/" className="hover:text-white">Back to Publications</Link>
        </p>
      </footer>
    </>
  )
}

function SermonCard({ sermon, expanded, onToggle }) {
  const ytId   = sermon.youtube_url ? getYouTubeId(sermon.youtube_url) : null
  const thumb  = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null
  const dateStr = sermon.sermon_date
    ? new Date(sermon.sermon_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        {/* Thumbnail or icon */}
        <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-brand-700 to-brand-900 flex-shrink-0 flex items-center justify-center">
          {thumb
            ? <img src={thumb} alt="" className="w-full h-full object-cover" />
            : <HiPlay size={22} className="text-white/70" />
          }
          {ytId && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                <HiPlay size={12} className="text-white ml-0.5" />
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-slate-800 leading-snug line-clamp-2">{sermon.title}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
            {sermon.speaker && (
              <span className="font-ui text-xs text-slate-500 flex items-center gap-1">
                <HiUser size={11} /> {sermon.speaker}
              </span>
            )}
            <span className="font-ui text-xs text-slate-400 flex items-center gap-1">
              <HiCalendar size={11} /> {dateStr}
            </span>
          </div>
        </div>

        <span className="text-slate-400 flex-shrink-0 mr-1">
          {expanded ? <HiChevronUp size={18} /> : <HiChevronDown size={18} />}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-5 border-t border-slate-100 pt-4">
          {sermon.description && (
            <p className="font-body text-slate-600 text-sm leading-relaxed mb-4">{sermon.description}</p>
          )}
          {ytId ? (
            <div className="relative pb-[56.25%] h-0 rounded-2xl overflow-hidden bg-black shadow-lg">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                title={sermon.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : sermon.audio_url ? (
            <audio controls className="w-full rounded-xl" src={sermon.audio_url}>
              Your browser does not support audio playback.
            </audio>
          ) : (
            <p className="font-ui text-sm text-slate-400 italic">No media attached to this sermon.</p>
          )}
          {sermon.youtube_url && (
            <a href={sermon.youtube_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 font-ui text-xs text-brand-600 hover:underline">
              <HiPlay size={13} /> Open on YouTube
            </a>
          )}
        </div>
      )}
    </div>
  )
}
