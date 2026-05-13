// Dynamic sitemap — auto-updates as publications are added
import { supabase } from '../lib/supabase'

const BASE_URL = 'https://dekusdaschool.vercel.app'

function generateSitemap(publications) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/resources</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/submit</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  ${publications.map(pub => `
  <url>
    <loc>${BASE_URL}/publication/${pub.id}</loc>
    <lastmod>${pub.updated_at ? pub.updated_at.split('T')[0] : pub.created_at.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}

</urlset>`
}

export default function Sitemap() { return null }

export async function getServerSideProps({ res }) {
  const { data: publications } = await supabase
    .from('publications')
    .select('id, created_at, updated_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  const sitemap = generateSitemap(publications || [])

  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.write(sitemap)
  res.end()

  return { props: {} }
}
