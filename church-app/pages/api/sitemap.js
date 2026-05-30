/**
 * /api/sitemap
 *
 * Served at /sitemap.xml via the rewrite in next.config.js.
 * As a true API route this ALWAYS returns raw XML — Next.js never wraps it
 * in HTML, which is why the previous page-based sitemap failed in Google
 * Search Console.
 */

import { createClient } from '@supabase/supabase-js'

const SITE = 'https://dekusdaschool.vercel.app'

const STATIC_PAGES = [
  { loc: '/',            changefreq: 'daily',   priority: '1.0' },
  { loc: '/devotional',  changefreq: 'daily',   priority: '0.9' },
  { loc: '/sermons',     changefreq: 'weekly',  priority: '0.8' },
  { loc: '/about',       changefreq: 'monthly', priority: '0.7' },
  { loc: '/resources',   changefreq: 'monthly', priority: '0.7' },
  { loc: '/submit',      changefreq: 'monthly', priority: '0.5' },
]

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function toDate(ts) {
  try { return new Date(ts).toISOString().split('T')[0] } catch { return '' }
}

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  let publications = []
  let sermons = []
  let devotionals = []

  try {
    const { data } = await supabase
      .from('publications')
      .select('id, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    publications = data || []
  } catch (_) {}

  try {
    const { data } = await supabase
      .from('sermons')
      .select('id, created_at')
      .order('created_at', { ascending: false })
    sermons = data || []
  } catch (_) {}

  try {
    const { data } = await supabase
      .from('devotionals')
      .select('id, published_date')
      .order('published_date', { ascending: false })
      .limit(30)
    devotionals = data || []
  } catch (_) {}

  const staticUrls = STATIC_PAGES.map(p => `
  <url>
    <loc>${SITE}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const pubUrls = publications.map(p => `
  <url>
    <loc>${SITE}/publication/${esc(p.id)}</loc>
    <lastmod>${toDate(p.created_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')

  const sermonUrls = sermons.length ? `
  <url>
    <loc>${SITE}/sermons</loc>
    <lastmod>${toDate(sermons[0].created_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>` : ''

  const devotionalUrl = devotionals.length ? `
  <url>
    <loc>${SITE}/devotional</loc>
    <lastmod>${toDate(devotionals[0].published_date)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>` : ''

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${pubUrls}${sermonUrls}${devotionalUrl}
</urlset>`

  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}
