import Head from 'next/head'
import Navbar from '../components/Navbar'
import { HiExternalLink } from 'react-icons/hi'

const RESOURCES = [
  {
    category: 'Bible Study',
    icon: '📖',
    gradient: 'from-brand-600 to-brand-800',
    items: [
      { icon:'📖', name:'Bible Gateway',           url:'https://www.biblegateway.com',            desc:'Read the Bible in over 200 versions and 70 languages. Includes commentary, devotionals, and study tools.' },
      { icon:'📗', name:'King James Bible Online', url:'https://www.kingjamesbibleonline.org/',              desc:'Free Bible app with reading plans, audio Bible, and community features.' },
      { icon:'📘', name:'Amazing Facts Bible Study', url:'https://www.amazingfacts.org/bible-study/bible-study-guides', desc:'Free Bible study guides covering prophecy, health, salvation, and more.' },
      { icon:'🕰️', name:'Bible History Timeline',  url:'https://timeline.biblehistory.com/home',  desc:'An interactive visual timeline of Bible history — explore events from creation to the early church era.' },
    ]
  },
  {
    category: 'EGW Estate',
    icon: '✍️',
    gradient: 'from-purple-600 to-purple-800',
    items: [
      { icon:'✍️', name:'EGW Writings',      url:'https://egwwritings.org',                 desc:'Official online library of all Ellen G. White\'s writings, fully searchable with cross-references.' },
      { icon:'🏛️', name:'White Estate',      url:'https://whiteestate.org',                 desc:'The official custodians of Ellen G. White\'s writings and legacy. Research resources and historical materials.' },
    ]
  },
  {
    category: 'Bible Truths',
    icon: '🔍',
    gradient: 'from-amber-600 to-amber-800',
    items: [
      { icon:'🕍', name:'Sabbath Truth',            url:'https://www.sabbathtruth.com',           desc:'A comprehensive resource dedicated to the biblical Sabbath — history, scripture, and theology.' },
      { icon:'💀', name:'Truth About Death',        url:'https://www.truthaboutdeath.com/',       desc:'What really happens when we die? A biblical exploration of the state of the dead and resurrection.' },
      { icon:'👑', name:'Mary Truth',               url:'https://www.marytruth.com/',             desc:'Biblical examination of Catholic Marian doctrines compared with Scripture. What does the Bible really teach?' },
      { icon:'G', name:'Ghost Truth',              url:'https://www.ghosttruth.com/',            desc:'What does the Bible say about ghosts, spirits, and the supernatural? A scripture-based study.' },
      { icon:'📜', name:'Ten Commandment Facts',    url:'http://www.tencommandmentfacts.com/',    desc:'An in-depth resource on the Ten Commandments — their history, meaning, and continued relevance today.' },
      { icon:'🎓', name:'Adventist Learning Community', url:'https://circle.adventistlearningcommunity.com/browse/161', desc:'Official SDA online courses and in-depth Bible study programs. Browse over 160 courses.' },
    ]
  },
  {
    category: 'Prophecy & End Times',
    icon: '🔮',
    gradient: 'from-red-700 to-red-900',
    items: [
      { icon:'🌍', name:'Bible Prophecy Truth',     url:'https://www.bibleprophecytruth.com/',    desc:'A thorough study of Bible prophecy — Daniel, Revelation, and end-time events explained clearly from Scripture.' },
      { icon:'☁️', name:'Rapture Truth',            url:'https://www.rapturetruth.com/',          desc:'What does the Bible actually say about the Second Coming? A biblical critique of popular rapture theories.' },
      { icon:'⚠️', name:'666 Truth',                url:'https://www.666truth.org/',              desc:'An in-depth Bible study on the mark of the beast, the number 666, and end-time prophecy in Revelation.' },
      { icon:'🇻🇦', name:'Papacy Watch',            url:'https://www.papacywatch.com/',           desc:'Examining the role of the papacy in Bible prophecy and its historical impact on religious history.' },
      { icon:'☀️', name:'White Throne Ministries',            url:'https://whitethroneministries.org',           desc:'Indulge in present-truth insights that your hungering soul craves.' },
    ]
  },
  {
    category: 'Adventist Ministries',
    icon: '🌍',
    gradient: 'from-green-600 to-green-800',
    items: [
      { icon:'🌍', name:'Adventist.org',          url:'https://www.adventist.org',                    desc:'The official website of the Seventh-day Adventist world church. News, beliefs, and global mission.' },
      { icon:'📚', name:'AdventSource',           url:'https://www.adventsource.org',                  desc:'Ministry and leadership resources for Adventist churches.' },
      { icon:'📺', name:'It Is Written',          url:'https://www.itiswritten.com',                   desc:'Christian television ministry with free Bible study resources and video sermons.' },
      { icon:'📡', name:'Hope Channel',           url:'https://www.hopechannel.com',                   desc:'Christian television broadcasting Christ-centered content globally.' },
    ]
  },
  {
    category: 'Worship & Music',
    icon: '🎵',
    gradient: 'from-rose-600 to-rose-800',
    items: [
      { icon:'🎵', name:'SDA Hymnal',             url:'https://sdahymnal.net',                         desc:'The complete Seventh-day Adventist Hymnal available online with lyrics.' },
      { icon:'🎼', name:'Adventist Hymnal App',   url:'https://www.adventisthymnal.org',               desc:'Digital hymnal with audio recordings and worship aids.' },
    ]
  },
  {
    category: 'Research & Commentary',
    icon: '🔬',
    gradient: 'from-slate-600 to-slate-800',
    items: [
      { icon:'🔬', name:'Adventist Biblical Research', url:'https://adventistbiblicalresearch.org',   desc:'Deep academic Bible study resources from the Adventist Biblical Research Institute.' },
      { icon:'📰', name:'Ministry Magazine',      url:'https://www.ministrymagazine.org',              desc:'A journal for Adventist clergy and church workers with theological articles.' },
    ]
  },
]

export default function ResourcesPage({ user, profile }) {
  return (
    <>
      <Head><title>Resources — Silent Witness: Truth in every page</title></Head>
      <Navbar user={user} profile={profile} />

      {/* Page hero */}
      <div className="hero-pattern py-8 sm:py-14 px-4 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-2xl sm:text-4xl font-bold mb-2 sm:mb-3">Study Resources</h1>
          <p className="font-ui text-xs sm:text-base text-blue-200 leading-relaxed">Curated tools to deepen your Bible study, prayer life, and understanding of Scripture and Adventist beliefs.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-12 space-y-8 sm:space-y-12">
        {RESOURCES.map(section => (
          <div key={section.category}>
            {/* Section header */}
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-5">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center text-base sm:text-xl shadow-sm flex-shrink-0`}>
                {section.icon}
              </div>
              <h2 className="font-display text-lg sm:text-2xl font-bold text-slate-900">{section.category}</h2>
            </div>

            {/* Resource cards grid — 2 cols on mobile, 2 on sm, 3 on lg */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {section.items.map(r => (
                <a key={r.name} href={r.url} target="_blank" rel="noopener"
                  className="group bg-white border border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <span className="text-xl sm:text-3xl">{r.icon}</span>
                    <HiExternalLink className="text-slate-300 group-hover:text-brand-500 transition-colors mt-0.5 flex-shrink-0" size={15} />
                  </div>
                  <h3 className="font-display text-sm sm:text-lg font-bold text-slate-900 mb-1 sm:mb-2 leading-snug">{r.name}</h3>
                  <p className="font-ui text-xs text-slate-500 leading-relaxed flex-1 hidden sm:block">{r.desc}</p>
                  <p className="font-ui text-xs text-slate-400 leading-tight flex-1 sm:hidden line-clamp-2">{r.desc}</p>
                  <div className="mt-3 pt-2 sm:mt-4 sm:pt-3 border-t border-slate-100">
                    <span className="font-ui text-xs font-bold text-brand-600 group-hover:underline">Visit →</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <footer className="hero-pattern text-white mt-8 py-6 text-center">
        <p className="font-ui text-sm text-blue-300">
          © {new Date().getFullYear()} Silent Witness: Truth in every page
        </p>
      </footer>
    </>
  )
}
