import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { HiBell, HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi'

export default function AnnouncementsBanner() {
  const [announcements, setAnnouncements] = useState([])
  const [current, setCurrent] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function fetchAnnouncements() {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, message, created_at')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gte.${today}`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!error && data?.length > 0) {
        setAnnouncements(data)
      }
    }
    fetchAnnouncements()
  }, [])

  if (dismissed || announcements.length === 0) return null

  const ann = announcements[current]

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-start sm:items-center gap-3">
        {/* Bell icon */}
        <div className="flex-shrink-0 mt-0.5 sm:mt-0">
          <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center">
            <HiBell size={14} className="text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-ui font-bold text-sm text-amber-900 flex-shrink-0">
              {ann.title}
            </span>
            <span className="font-body text-sm text-amber-800 leading-snug">
              {ann.message}
            </span>
          </div>
          {announcements.length > 1 && (
            <div className="font-ui text-[10px] text-amber-600 mt-0.5">
              {current + 1} of {announcements.length} announcements
            </div>
          )}
        </div>

        {/* Navigation for multiple announcements */}
        {announcements.length > 1 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setCurrent(c => (c - 1 + announcements.length) % announcements.length)}
              className="p-1 rounded-lg hover:bg-amber-200 text-amber-700 transition-colors"
            >
              <HiChevronLeft size={15} />
            </button>
            <button
              onClick={() => setCurrent(c => (c + 1) % announcements.length)}
              className="p-1 rounded-lg hover:bg-amber-200 text-amber-700 transition-colors"
            >
              <HiChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-amber-200 text-amber-600 transition-colors"
          title="Dismiss"
        >
          <HiX size={14} />
        </button>
      </div>
    </div>
  )
}
