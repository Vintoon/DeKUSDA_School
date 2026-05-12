import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '../components/Navbar'
import { HiArrowLeft, HiExternalLink } from 'react-icons/hi'

const BELIEFS = [
  {
    icon: '📖',
    title: 'Sola Scriptura',
    desc: 'We believe the Bible is the inspired Word of God and the only rule of faith and practice.',
  },
  {
    icon: '✝️',
    title: 'Salvation by Grace',
    desc: 'Salvation is a free gift through faith in Jesus Christ alone — not by works, but by His grace.',
  },
  {
    icon: '📯',
    title: 'The Three Angels\' Messages',
    desc: 'We are called to proclaim Revelation 14:6–12 — the everlasting gospel — to every nation, tribe, tongue and people.',
  },
  {
    icon: '🕊️',
    title: 'The Sabbath',
    desc: 'We honour the seventh-day Sabbath (Saturday) as the memorial of creation and a sign of God\'s people.',
  },
  {
    icon: '🌿',
    title: 'Healthful Living',
    desc: 'Our bodies are temples of the Holy Spirit. We promote wholesome living as a witness to God\'s love.',
  },
  {
    icon: '🌍',
    title: 'Global Mission',
    desc: 'Spreading the gospel to all corners of the earth before the soon return of Jesus Christ.',
  },
]

const TEAM = [
  {
    name: 'DeKUSDA Ministry',
    role: 'Editorial Team',
    desc: 'A dedicated group of students and faculty committed to sharing truth through written and digital media.',
  },
]

export default function AboutPage({ user, profile }) {
  return (
    <>
      <Head>
        <title>About — Three Angels Publications</title>
        <meta name="description" content="Learn about DeKUSDA's Silent Witness ministry and our mission to proclaim God's Word." />
      </Head>
      <Navbar user={user} profile={profile} />

      {/* Hero */}
      <section className="hero-pattern text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs font-ui font-medium text-blue-200 mb-5">
            ✞ Silent Witness: Truth in every page
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            About Our Ministry
          </h1>
          <p className="font-body text-lg text-blue-200 leading-relaxed max-w-2xl mx-auto">
            DeKUSDA's Silent Witness publication ministry exists to share the everlasting gospel
            through sermons, devotionals, testimonies and Bible studies — freely and faithfully.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 font-ui text-sm text-slate-500 hover:text-brand-600 transition-colors -mb-8">
          <HiArrowLeft size={15} /> Back to Publications
        </Link>

        {/* Mission */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="hero-pattern px-6 sm:px-8 py-6 flex items-center gap-4">
            <div className="text-4xl">🕊️</div>
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Our Mission</h2>
              <p className="font-ui text-blue-200 text-sm">Why we exist</p>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <p className="font-body text-xl text-slate-600 italic leading-relaxed border-l-4 border-brand-500 pl-5 mb-6">
              "Then I saw another angel flying in mid-air, and he had the eternal gospel to proclaim
              to those who live on the earth — to every nation, tribe, language and people."
            </p>
            <p className="font-ui text-xs font-bold text-brand-600 tracking-widest uppercase mb-6">— Revelation 14:6</p>
            <div className="space-y-4 font-body text-lg text-slate-700 leading-relaxed">
              <p>
                The <strong>DeKUSDA Silent Witness</strong> publication ministry was founded on the conviction
                that the printed and digital word remains one of the most powerful tools for evangelism.
                We are a student-led ministry at DeKUSDA committed to producing quality Christian content
                that uplifts, educates, and prepares God's people for His soon return.
              </p>
              <p>
                Our publications are peer-reviewed by our editorial team before being made available
                to the public — ensuring that everything we share aligns with Scripture and reflects
                the spirit of the Three Angels' Messages.
              </p>
              <p>
                We warmly invite students, faculty, and members of the wider community to contribute
                sermons, devotionals, testimonies, health articles, and Bible studies. All truth-filled
                voices are welcome.
              </p>
            </div>
          </div>
        </section>

        {/* What we believe */}
        <section>
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">What We Believe</h2>
            <p className="font-ui text-slate-500 text-sm">The pillars of our faith and ministry</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BELIEFS.map(b => (
              <div key={b.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="font-display text-base font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="font-ui text-sm text-slate-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-brand-50 border border-brand-100 rounded-3xl p-6 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">How It Works</h2>
            <p className="font-ui text-slate-500 text-sm">From submission to publication</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step:'01', icon:'✍️', title:'Submit',  desc:'Anyone can submit a sermon, devotional, testimony or Bible study using the submission form.' },
              { step:'02', icon:'🔍', title:'Review',  desc:'Our editorial team carefully reviews each submission to ensure it aligns with Scripture and our standards.' },
              { step:'03', icon:'📢', title:'Publish', desc:'Approved articles are published on the platform and made freely available to readers worldwide.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center font-display font-bold text-lg mx-auto mb-3 shadow-sm">
                  {s.step}
                </div>
                <div className="text-3xl mb-2">{s.icon}</div>
                <h3 className="font-display font-bold text-slate-800 mb-1">{s.title}</h3>
                <p className="font-ui text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Logo / Identity */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-36 h-36 flex-shrink-0">
              <Image src="/logo.png" alt="Three Angels Logo" fill className="object-contain drop-shadow-lg" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-3">The Three Angels</h2>
              <p className="font-body text-lg text-slate-600 leading-relaxed mb-4">
                Our ministry takes its name and symbol from Revelation 14 — the three angels
                carrying the everlasting gospel. The first angel calls the world to worship the
                Creator. The second announces the fall of Babylon. The third warns against the
                mark of the beast. Together they represent God's final message of mercy before
                the return of Jesus.
              </p>
              <p className="font-ui text-sm text-slate-500">
                Every article, sermon, and testimony on this platform is offered in the spirit
                of that mission — freely given, freely received.
              </p>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="bg-gradient-to-br from-brand-600 to-brand-900 rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative">
            <div className="text-5xl mb-4">✉️</div>
            <h2 className="font-display text-3xl font-bold mb-3">Share Your Voice</h2>
            <p className="font-ui text-blue-200 text-base leading-relaxed mb-7 max-w-xl mx-auto">
              Do you have a sermon, testimony, devotional, or Bible study to share? Submit it for review
              and let your voice reach readers across the globe.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/submit"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-white text-brand-700 rounded-xl font-ui font-bold text-sm hover:bg-blue-50 transition-colors shadow-md min-h-[48px]">
                Submit an Article
              </Link>
              <Link href="/"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 border border-white/20 text-white rounded-xl font-ui font-bold text-sm hover:bg-white/20 transition-colors min-h-[48px]">
                <HiExternalLink size={16} /> Browse Publications
              </Link>
            </div>
          </div>
        </section>

      </div>

      <footer className="hero-pattern text-white mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="font-ui text-sm text-blue-300">
            © {new Date().getFullYear()} DeKUSDA Silent Witness Ministry &nbsp;·&nbsp;
            <Link href="/" className="hover:text-white transition-colors">Publications</Link>
            &nbsp;·&nbsp;
            <Link href="/submit" className="hover:text-white transition-colors">Submit</Link>
          </p>
        </div>
      </footer>
    </>
  )
}
