import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import PublicationCard from '../components/PublicationCard'
import { supabase } from '../lib/supabase'
import { HiSearch, HiChevronRight, HiExternalLink, HiSparkles, HiRefresh } from 'react-icons/hi'

const CATEGORIES = ['all','about','devotional','sermon','study','Health','testimony','news','review']
const CAT_LABELS  = {
  all:'All', about:'About', devotional:'Devotionals', sermon:'Sermons',
  study:'Bible Studies', Health:'Health', testimony:'Testimonies',
  news:'Church News', review:'Book Reviews'
}

const RESOURCES = [
  { icon:'📖', name:'Bible Gateway',           url:'https://www.biblegateway.com',                                        desc:'Multiple Bible versions' },
  { icon:'✍️', name:'EGW Writings',            url:'https://egwwritings.org',                                             desc:'Ellen G. White Estate' },
  { icon:'🏛️', name:'White Estate',            url:'https://whiteestate.org',                                            desc:'Official EGW resources' },
  { icon:'📗', name:'King James Bible Online', url:'https://www.kingjamesbibleonline.org/',                               desc:'Bible with reading plans' },
  { icon:'🎓', name:'Adventist Learning',      url:'https://circle.adventistlearningcommunity.com/browse/161',            desc:'SDA Courses' },
  { icon:'📘', name:'Amazing Facts',           url:'https://www.amazingfacts.org/bible-study/bible-study-guides',         desc:'Bible study guides' },
]

const SCRIPTURES = [
  { text:'Your word is a lamp to my feet and a light to my path.',                                                           ref:'Psalm 119:105' },
  { text:'Then I saw another angel flying in mid-air, and he had the eternal gospel to proclaim to those who live on the earth.', ref:'Revelation 14:6' },
  { text:'Go therefore and make disciples of all nations.',                                                                  ref:'Matthew 28:19' },
  { text:'The grass withers and the flowers fall, but the word of our God endures forever.',                                 ref:'Isaiah 40:8' },
]

export default function Home({ user, profile, initialPublications, initialStats }) {
  const pubs  = initialPublications || []
  const stats = initialStats        || { total: 0, sermons: 0, contributors: 0 }

  const [publications, setPublications] = useState(pubs)
  const [loading, setLoading]           = useState(false)
  const [fetchError, setFetchError]     = useState(false)
  const [category, setCategory]         = useState('all')
  const [search, setSearch]             = useState('')
  const [verse, setVerse]               = useState(SCRIPTURES[0])

  useEffect(() => {
    setVerse(SCRIPTURES[new Date().getDate() % SCRIPTURES.length])
  }, [])

  const loadPublications = useCallback(async (cat) => {
    setLoading(true)
    setFetchError(false)
    try {
      let q = supabase
        .from('publications')
        .select('id, title, summary, category, cover_image_url, pdf_url, youtube_url, allow_download, author_name, featured, like_count, comment_count, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
      if (cat && cat !== 'all') q = q.eq('category', cat)
      const { data, error } = await q
      if (error) { setFetchError(true); setPublications([]) }
      else        { setPublications(data || []) }
    } catch(e) {
      setFetchError(true); setPublications([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleCategory(cat) {
    setCategory(cat)
    if (cat === 'all' && pubs.length > 0) {
      setPublications(pubs) // use server data instantly
    } else {
      loadPublications(cat)
    }
  }

  const filtered = search.trim()
    ? publications.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.summary?.toLowerCase().includes(search.toLowerCase()))
    : publications

  return (
    <div className="w-full overflow-x-hidden">
      <Head>
        <title>In Light of the Word: Truth in every page</title>
        <meta name="description" content="Church publications, sermons, devotionals and more." />
        <link rel="icon" href="/logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar user={user} profile={profile} />

      {/* Hero */}
      <section className="hero-pattern text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-10 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative w-full px-4 sm:px-6 py-8 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
            <div className="animate-fadeUp min-w-0">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs font-ui font-medium text-blue-200 mb-4">
                ✞ In Light of the Word: Truth in every page
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
                Proclaiming <span className="text-gold-400">God's Word</span> to the World
              </h1>
              <p className="font-body text-sm sm:text-lg text-blue-200 leading-relaxed mb-6 max-w-lg">
                Sermons, devotionals, testimonies and Bible studies — reviewed, trusted, and freely shared.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#publications" className="inline-flex items-center justify-center min-h-[44px] px-5 bg-white text-brand-800 font-ui font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg text-sm">
                  Browse Publications
                </a>
                <Link href="/submit" className="inline-flex items-center justify-center min-h-[44px] px-5 bg-gold-500 hover:bg-gold-600 text-white font-ui font-bold rounded-xl transition-all shadow-lg text-sm">
                  Submit Article
                </Link>
              </div>
              <div className="lg:hidden mt-5 bg-white/10 border border-white/20 backdrop-blur-sm rounded-2xl p-4">
                <p className="font-body text-sm italic text-white/90 leading-relaxed mb-2">"{verse.text}"</p>
                <p className="font-ui text-[10px] font-bold text-gold-400 tracking-widest uppercase">{verse.ref}</p>
              </div>
            </div>
            <div className="hidden lg:flex flex-col items-center gap-5">
              <div className="relative w-60 h-48 drop-shadow-2xl">
                <Image src="/logo.png" alt="Three Angels" fill className="object-contain" />
              </div>
              <div className="bg-white/10 border border-white/20 backdrop-blur rounded-2xl p-5 max-w-sm text-center">
                <p className="font-body text-base italic text-white/90 leading-relaxed mb-2">"{verse.text}"</p>
                <p className="font-ui text-xs font-bold text-gold-400 tracking-widest uppercase">{verse.ref}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-brand-900 border-b border-brand-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-center sm:justify-start gap-0">
          {[
            { label:'Publications', val:stats.total,        icon:'📄' },
            { label:'Sermons',      val:stats.sermons,      icon:'🎙️' },
            { label:'Contributors', val:stats.contributors, icon:'✍️' },
          ].map((s, i) => (
            <div key={s.label} className={`flex items-center gap-2 flex-shrink-0 px-4 sm:px-6 ${i > 0 ? 'border-l border-white/10' : ''}`}>
              <span className="text-base hidden sm:block">{s.icon}</span>
              <div>
                <div className="font-display text-lg sm:text-2xl font-bold text-gold-400 leading-none">{s.val}</div>
                <div className="font-ui text-[10px] sm:text-xs text-blue-300 uppercase tracking-wide mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div id="publications" className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">

        {/* Mobile resources grid */}
        <div className="lg:hidden mb-7">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold text-slate-800">📚 Study Resources</h3>
            <Link href="/resources" className="font-ui text-xs font-semibold text-brand-600 hover:underline flex items-center gap-0.5 min-h-[36px]">
              View all <HiChevronRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {RESOURCES.map(r => (
              <a key={r.name} href={r.url} target="_blank" rel="noopener"
                className="flex flex-col items-center gap-1.5 bg-white border border-slate-100 rounded-xl p-3 shadow-sm text-center hover:border-brand-200 hover:shadow-md active:scale-95 transition-all min-h-[72px]">
                <span className="text-2xl leading-none">{r.icon}</span>
                <span className="font-ui text-[10px] font-semibold text-slate-700 leading-tight line-clamp-2 w-full text-center">{r.name}</span>
              </a>
            ))}
            <Link href="/resources" className="flex flex-col items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 rounded-xl p-3 shadow-sm text-white text-center transition-colors active:scale-95 min-h-[72px]">
              <HiExternalLink size={20} />
              <span className="font-ui text-[10px] font-semibold leading-tight">More</span>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_290px] gap-10">
          <div className="min-w-0">
            {/* Search */}
            <div className="relative mb-4 w-full">
              <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search publications…"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl font-ui text-sm bg-white focus:border-brand-400 shadow-sm outline-none transition-shadow focus:shadow-md min-h-[44px]" />
            </div>

            {/* Category filter */}
            <div className="relative mb-5">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map(cat => (
                  cat === 'about'
                    ? <Link key="about" href="/about"
                        className="flex-shrink-0 px-4 py-2 rounded-full font-ui text-sm font-semibold transition-all min-h-[40px] bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50">
                        About
                      </Link>
                    : <button key={cat} onClick={() => handleCategory(cat)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full font-ui text-sm font-semibold transition-all min-h-[40px] ${
                          category === cat
                            ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-200'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50'
                        }`}>
                        {CAT_LABELS[cat]}
                      </button>
                ))}
              </div>
            </div>

            {/* Section header */}
            {!search && (
              <div className="flex items-center gap-2 mb-4">
                <HiSparkles className="text-gold-500 flex-shrink-0" size={14} />
                <span className="font-ui text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  {category === 'all' ? 'Latest Publications' : CAT_LABELS[category]}
                </span>
                <div className="flex-1 h-px bg-slate-100 min-w-0" />
                {!loading && (
                  <button onClick={() => loadPublications(category)}
                    className="text-slate-400 hover:text-brand-600 transition-colors p-1" title="Refresh">
                    <HiRefresh size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Publications grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_,i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden w-full">
                    <div className="skeleton h-44 w-full rounded-none" />
                    <div className="p-4 space-y-3">
                      <div className="skeleton h-3 w-1/3" />
                      <div className="skeleton h-5 w-4/5" />
                      <div className="skeleton h-3 w-full" />
                      <div className="skeleton h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : fetchError ? (
              <div className="text-center py-16 px-4">
                <div className="text-5xl mb-4">⚠️</div>
                <h3 className="font-display text-xl font-bold text-slate-700 mb-2">Could not load publications</h3>
                <p className="font-ui text-slate-400 text-sm mb-5">Check your internet connection and try again.</p>
                <button onClick={() => loadPublications(category)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-ui font-semibold text-sm hover:bg-brand-700 transition-colors min-h-[44px]">
                  <HiRefresh size={16} /> Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="text-5xl mb-4">📜</div>
                <h3 className="font-display text-xl font-bold text-slate-700 mb-2">No publications found</h3>
                <p className="font-ui text-slate-400 text-sm">{search ? 'Try a different search term.' : 'Be the first to submit one!'}</p>
                <Link href="/submit" className="inline-flex items-center justify-center mt-5 px-6 py-3 bg-brand-600 text-white rounded-xl font-ui font-semibold text-sm hover:bg-brand-700 transition-colors min-h-[44px]">
                  Submit Article
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map(pub => <PublicationCard key={pub.id} pub={pub} />)}
              </div>
            )}
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden lg:flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="hero-pattern px-5 py-4 flex items-center gap-2">
                <span className="text-lg">📚</span>
                <h3 className="font-display text-white font-bold text-base">Study Resources</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {RESOURCES.map(r => (
                  <a key={r.name} href={r.url} target="_blank" rel="noopener"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors group">
                    <span className="text-xl">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-ui font-semibold text-sm text-slate-800 truncate">{r.name}</div>
                      <div className="font-ui text-xs text-slate-400 truncate">{r.desc}</div>
                    </div>
                    <HiChevronRight className="text-slate-300 group-hover:text-brand-500 flex-shrink-0 transition-colors" size={15} />
                  </a>
                ))}
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                <Link href="/resources" className="block text-center font-ui text-xs font-bold text-brand-600 hover:underline py-1">
                  View All Resources →
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-5 text-white text-center shadow-lg relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
              <div className="relative">
                <div className="text-3xl mb-2">✍️</div>
                <h3 className="font-display text-base font-bold mb-1.5">Share Your Message</h3>
                <p className="font-ui text-xs text-blue-200 mb-4 leading-relaxed">Submit your sermon, testimony, or devotional for review.</p>
                <Link href="/submit" className="block px-4 py-3 bg-white text-brand-700 rounded-xl font-ui font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm min-h-[44px]">
                  Submit Now
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="lg:hidden w-full px-4 mb-8">
        <div className="w-full bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white text-center relative overflow-hidden shadow-lg">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative">
            <div className="text-4xl mb-3">✍️</div>
            <h3 className="font-display text-lg font-bold mb-2">Share Your Message</h3>
            <p className="font-ui text-sm text-blue-200 mb-5 leading-relaxed max-w-xs mx-auto">
              Submit your sermon, testimony, or devotional for review and publication.
            </p>
            <Link href="/submit" className="inline-flex items-center justify-center w-full max-w-xs mx-auto px-6 py-3.5 bg-white text-brand-700 rounded-xl font-ui font-bold text-sm hover:bg-blue-50 transition-colors min-h-[48px]">
              Submit Now
            </Link>
          </div>
        </div>
      </div>

      <footer className="hero-pattern text-white mt-4 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto flex-shrink-0" />
              <div>
                <div className="font-display font-bold text-base leading-none">Three Angels</div>
                <div className="font-ui text-xs text-blue-300 mt-0.5">In Light of the Word: Truth in every page</div>
              </div>
            </div>
            <p className="font-ui text-sm text-blue-300 leading-relaxed">
              Spreading the everlasting gospel to every nation, tribe, tongue and people.
            </p>
          </div>
          <div>
            <h4 className="font-ui font-bold text-xs uppercase tracking-widest text-gold-400 mb-4">Quick Links</h4>
            <ul className="space-y-2.5 font-ui text-sm text-blue-200">
              <li><Link href="/"          className="hover:text-white transition-colors inline-block py-0.5">Publications</Link></li>
              <li><Link href="/about"     className="hover:text-white transition-colors inline-block py-0.5">About</Link></li>
              <li><Link href="/resources" className="hover:text-white transition-colors inline-block py-0.5">Resources</Link></li>
              <li><Link href="/submit"    className="hover:text-white transition-colors inline-block py-0.5">Submit Article</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-ui font-bold text-xs uppercase tracking-widest text-gold-400 mb-4">Scripture</h4>
            <p className="font-body italic text-blue-200 text-sm leading-relaxed">
              "Fear God and give him glory, because the hour of his judgment has come."
            </p>
            <p className="font-ui text-xs text-gold-400 mt-2 font-semibold">— Revelation 14:7</p>
          </div>
        </div>
        <div className="border-t border-white/10 text-center py-4 px-4 text-xs font-ui text-blue-400">
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> In Light of the Word: Truth in every page. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

// Fetch publications SERVER-SIDE so mobile gets data instantly with the HTML
// No waiting for JS to load and fetch — works even on slow 2G/3G connections
export async function getServerSideProps() {
  try {
    const { data, error } = await supabase
      .from('publications')
      .select('id, title, summary, category, cover_image_url, pdf_url, youtube_url, allow_download, author_name, featured, like_count, comment_count, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error || !data) {
      return { props: { initialPublications: [], initialStats: { total:0, sermons:0, contributors:0 } } }
    }

    const initialStats = {
      total:        data.length,
      sermons:      data.filter(p => p.category === 'sermon').length,
      contributors: new Set(data.map(p => p.author_name).filter(Boolean)).size,
    }

    return {
      props: { initialPublications: data, initialStats },
    }
  } catch(e) {
    return { props: { initialPublications: [], initialStats: { total:0, sermons:0, contributors:0 } } }
  }
}
