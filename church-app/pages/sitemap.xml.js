/**
 * Dynamic sitemap — served at /sitemap.xml
 * Queries Supabase for all approved publications so the sitemap always stays
 * current. Google Search Console "failed to fetch" is fixed because this is a
 * live server-side route, not a stale static file.
 *
 * After deploying, re-submit the sitemap URL in Google Search Console:
 *   https://search.google.com/search-console  → Sitemaps → submit
 *   https://dekusdaschool.vercel.app/sitemap.xml
 */

import { createClient } from '@supabase/supabase-js'

const SITE = 'https://dekusdaschool.vercel.app'

const STATIC_PAGES = [
  { loc: '/',         changefreq: 'daily',   priority: '1.0' },
  { loc: '/about',    changefreq: 'monthly', priority: '0.7' },
  { loc: '/resources',changefreq: 'monthly', priority: '0.7' },
  { loc: '/sermons',  changefreq: 'weekly',  priority: '0.8' },
  { loc: '/submit',   changefreq: 'monthly', priority: '0.5' },
]

function escapeXml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

export default function Sitemap() { return null }

export async function getServerSideProps({ res }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  let publications = []
  let sermons = []

  try {
    const { data } = await supabase
      .from('publications')
      .select('id, created_at, category')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    publications = data || []
  } catch (_) {}

  try {
    const { data } = await supabase
      .from('sermons')
      .select('id, created_at')
      .order('sermon_date', { ascending: false })
    sermons = data || []
  } catch (_) {}

  const staticUrls = STATIC_PAGES.map(p => `
  <url>
    <loc>${SITE}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const pubUrls = publications.map(p => `
  <url>
    <loc>${SITE}/publication/${escapeXml(p.id)}</loc>
    <lastmod>${new Date(p.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')

  const sermonUrls = sermons.map(s => `
  <url>
    <loc>${SITE}/sermons#${escapeXml(s.id)}</loc>
    <lastmod>${new Date(s.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${pubUrls}
${sermonUrls}
</urlset>`

  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  res.write(xml)
  res.end()

  return { props: {} }
}
