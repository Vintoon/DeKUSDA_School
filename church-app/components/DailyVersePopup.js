import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { HiX, HiBookOpen } from 'react-icons/hi'

export default function DailyVersePopup() {
  const [verse, setVerse] = useState(null)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const dismissed = localStorage.getItem('verse_dismissed_date')

    // Only show if not already dismissed today
    if (dismissed === today) {
      setLoading(false)
      return
    }

    async function fetchVerse() {
      const { data, error } = await supabase
        .from('daily_verse')
        .select('verse_text, verse_reference, verse_date')
        .eq('verse_date', today)
        .maybeSingle()

      if (!error && data) {
        setVerse(data)
        setVisible(true)
      }
      setLoading(false)
    }

    fetchVerse()
  }, [])

  function dismiss() {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem('verse_dismissed_date', today)
    setVisible(false)
  }

  if (!visible || loading || !verse) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeUp">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        {/* Header banner */}
        <div className="hero-pattern px-6 pt-7 pb-10 text-center relative overflow-hidden">
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/15 border border-white/20 rounded-2xl mb-3">
              <HiBookOpen size={22} className="text-gold-400" />
            </div>
            <div className="font-ui text-[10px] font-bold text-gold-400 tracking-[0.2em] uppercase mb-1">
              Verse of the Day
            </div>
            <div className="font-ui text-xs text-blue-200">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Verse content — overlapping card */}
        <div className="px-6 pb-7 -mt-6 relative">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 px-5 py-5">
            <div className="text-2xl text-center mb-3">✦</div>
            <p className="font-body text-xl text-slate-800 italic leading-relaxed text-center mb-4">
              &ldquo;{verse.verse_text}&rdquo;
            </p>
            <p className="font-ui text-xs font-bold text-brand-600 tracking-widest uppercase text-center">
              — {verse.verse_reference}
            </p>
          </div>

          <button
            onClick={dismiss}
            className="mt-4 w-full py-3 px-5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-ui font-semibold text-sm transition-colors min-h-[44px] shadow-md shadow-brand-200"
          >
            Amen 🙏
          </button>
          <button
            onClick={dismiss}
            className="mt-2 w-full py-2 font-ui text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Dismiss for today
          </button>
        </div>

        {/* Close X */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
        >
          <HiX size={15} />
        </button>
      </div>

      <style jsx>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
