import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { HiCalendar, HiChevronDown, HiChevronUp, HiBookOpen } from 'react-icons/hi'

export default function DevotionalPage({ user, profile }) {
  const [today, setToday]       = useState(null)
  const [archive, setArchive]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchDevotionals() }, [])

  async function fetchDevotionals() {
    setLoading(true)
    const todayDate = new Date().toISOString().split('T')[0]

    // Fetch today's + last 30
    const { data } = await supabase
      .from('devotionals')
      .select('*')
      .order('published_date', { ascending: false })
      .limit(31)

    if (data?.length) {
      const todayEntry = data.find(d => d.published_date === todayDate) || data[0]
      setToday(todayEntry)
      setArchive(data.filter(d => d.id !== todayEntry.id))
    }
    setLoading(false)
  }

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      <Head>
        <title>Daily Devotional — In Light of the Word</title>
        <meta name="description" content="Start your day in God's Word. Daily devotionals from In Light of the Word — scripture, reflection, and prayer." />
        <meta property="og:title" content="Daily Devotional — In Light of the Word" />
        <meta property="og:description" content="Start your day in God's Word. Daily devotionals — scripture, reflection, and prayer." />
        <meta property="og:site_name" content="In Light of the Word" />
      </Head>
      <Navbar user={user} profile={profile} />

      {/* Hero */}
      <div className="hero-pattern pt-12 pb-8 px-4 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs font-ui font-medium text-blue-200 mb-4">
            <HiBookOpen size={13} /> Daily Devotional
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white mb-2">Morning with God</h1>
          <p className="font-ui text-blue-200 text-sm">{todayFormatted}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Today's devotional */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-10 space-y-4 animate-pulse">
            <div className="h-4 bg-slate-100 rounded-full w-1/3" />
            <div className="h-7 bg-slate-100 rounded-full w-3/4" />
            <div className="h-16 bg-slate-100 rounded-2xl w-full" />
            <div className="space-y-2">
              <div className="h-3 bg-slate-100 rounded-full w-full" />
              <div className="h-3 bg-slate-100 rounded-full w-5/6" />
              <div className="h-3 bg-slate-100 rounded-full w-4/5" />
            </div>
          </div>
        ) : !today ? (
          <div className="text-center py-16 mb-10">
            <div className="text-5xl mb-4">📖</div>
            <h2 className="font-display text-xl font-bold text-slate-700 mb-2">No devotional today yet</h2>
            <p className="font-ui text-slate-500 text-sm">Check back later — our team posts each morning.</p>
          </div>
        ) : (
          <TodayCard devotional={today} />
        )}

        {/* Archive */}
        {archive.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="font-ui text-xs font-bold text-slate-400 uppercase tracking-widest">Previous Devotionals</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="space-y-3">
              {archive.map(d => (
                <ArchiveCard
                  key={d.id}
                  devotional={d}
                  expanded={expanded === d.id}
                  onToggle={() => setExpanded(expanded === d.id ? null : d.id)}
                />
              ))}
            </div>
          </>
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

function TodayCard({ devotional }) {
  const dateStr = devotional.published_date
    ? new Date(devotional.published_date + 'T12:00:00').toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden mb-10">
      {/* Top accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-brand-700 via-brand-500 to-indigo-500" />

      <div className="p-7 sm:p-8">
        {/* Date badge */}
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-100 text-xs font-ui font-bold px-3 py-1 rounded-full">
            <HiCalendar size={11} /> {dateStr}
          </span>
          <span className="text-xs font-ui text-slate-400">Today</span>
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-5">
          {devotional.title}
        </h2>

        {/* Scripture block */}
        {devotional.verse && (
          <div className="bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 rounded-2xl px-5 py-4 mb-6 relative">
            <div className="absolute top-3 left-4 text-brand-200 font-display text-4xl leading-none select-none">"</div>
            <p className="font-body text-lg text-brand-900 italic leading-relaxed pt-3 pl-3 pr-2">
              {devotional.verse}
            </p>
            {devotional.verse_reference && (
              <p className="font-ui text-xs font-bold text-brand-600 tracking-widest uppercase mt-2 text-right">
                — {devotional.verse_reference}
              </p>
            )}
          </div>
        )}

        {/* Devotional content — rendered as HTML to support images and links */}
        <div
          className="font-body text-slate-700 text-base sm:text-lg leading-relaxed prose-content"
          dangerouslySetInnerHTML={{ __html: devotional.content }}
        />

        {/* Author */}
        {devotional.author_name && (
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {devotional.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-ui text-sm font-semibold text-slate-700">{devotional.author_name}</div>
              <div className="font-ui text-xs text-slate-400">In Light of the Word</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ArchiveCard({ devotional, expanded, onToggle }) {
  const dateStr = devotional.published_date
    ? new Date(devotional.published_date + 'T12:00:00').toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        {/* Left accent */}
        <div className="w-1 h-10 rounded-full bg-gradient-to-b from-brand-400 to-brand-700 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-slate-800 leading-snug">{devotional.title}</div>
          <div className="font-ui text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <HiCalendar size={10} /> {dateStr}
            {devotional.verse_reference && <span className="ml-2 text-brand-500">· {devotional.verse_reference}</span>}
          </div>
        </div>
        <span className="text-slate-400 flex-shrink-0">
          {expanded ? <HiChevronUp size={17} /> : <HiChevronDown size={17} />}
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100">
          {devotional.verse && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-4 mt-3">
              <p className="font-body text-base text-brand-900 italic leading-relaxed">"{devotional.verse}"</p>
              {devotional.verse_reference && (
                <p className="font-ui text-xs font-bold text-brand-600 uppercase tracking-wide mt-1.5">— {devotional.verse_reference}</p>
              )}
            </div>
          )}
          <div className="font-body text-slate-700 leading-relaxed prose-content" dangerouslySetInnerHTML={{ __html: devotional.content }} />
          {devotional.author_name && (
            <p className="font-ui text-xs text-slate-400 mt-3">— {devotional.author_name}</p>
          )}
        </div>
      )}
    </div>
  )
}
