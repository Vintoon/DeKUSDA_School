/**
 * QuoteOfDay.js
 *
 * A beautiful popup that shows today's verse from the `daily_verse` table.
 * Appears once per day — the date is stored in localStorage so returning
 * visitors don't see it again until the next day.
 * Visitors can dismiss it or click "Read today's devotional" to go deeper.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'iltw_qod_last_shown'

export default function QuoteOfDay() {
  const [visible, setVisible]   = useState(false)
  const [verse, setVerse]       = useState(null)
  const [closing, setClosing]   = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const lastShown = localStorage.getItem(STORAGE_KEY)

    // Only show if not already shown today
    if (lastShown === today) return

    // Fetch today's verse (or latest if none for today)
    ;(async () => {
      let { data } = await supabase
        .from('daily_verse')
        .select('verse_text, verse_reference, verse_date')
        .eq('verse_date', today)
        .maybeSingle()

      if (!data) {
        const { data: latest } = await supabase
          .from('daily_verse')
          .select('verse_text, verse_reference, verse_date')
          .order('verse_date', { ascending: false })
          .limit(1)
          .maybeSingle()
        data = latest
      }

      if (data) {
        setVerse(data)
        // Small delay so it doesn't pop immediately on page load
        setTimeout(() => setVisible(true), 1200)
      }
    })()
  }, [])

  function dismiss() {
    setClosing(true)
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(STORAGE_KEY, today)
    setTimeout(() => { setVisible(false); setClosing(false) }, 400)
  }

  if (!visible || !verse) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        className={`fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Popup card */}
      <div className={`fixed z-[201] inset-0 flex items-center justify-center p-4 pointer-events-none`}>
        <div className={`pointer-events-auto w-full max-w-md transition-all duration-400 ${closing ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* Top gradient banner */}
            <div className="hero-pattern px-6 py-5 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-300/10 rounded-full blur-xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✞</span>
                    <span className="font-ui text-xs font-bold text-blue-200 uppercase tracking-widest">Quote of the Day</span>
                  </div>
                  <button
                    onClick={dismiss}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all text-lg leading-none"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="font-ui text-xs text-blue-300">
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Quote body */}
            <div className="px-7 py-6">
              {/* Large opening quote mark */}
              <div className="font-display text-6xl text-brand-100 leading-none select-none mb-1 -mt-2">"</div>

              <blockquote className="font-body text-slate-800 text-lg sm:text-xl leading-relaxed italic font-medium -mt-4">
                {verse.verse_text}
              </blockquote>

              {/* Reference */}
              <div className="mt-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-brand-100" />
                <span className="font-ui text-sm font-bold text-brand-700 tracking-wide">
                  — {verse.verse_reference}
                </span>
                <div className="h-px flex-1 bg-brand-100" />
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-7 pb-6 flex items-center gap-3">
              <Link
                href="/devotional"
                onClick={dismiss}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-ui text-sm font-bold text-center transition-all shadow-sm hover:shadow-md"
              >
                📖 Today's Devotional
              </Link>
              <button
                onClick={dismiss}
                className="px-5 py-3 border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 rounded-2xl font-ui text-sm font-semibold transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
